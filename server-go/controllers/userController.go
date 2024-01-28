package controllers

import (
	"context"
	"fmt"
	"net/http"
	"time"
	"vinisync/server/models"
	"vinisync/server/models/web"
	"vinisync/server/utils"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"golang.org/x/crypto/bcrypt"
)

const BCRYPT_SALT_ROUNDS = 10
const PWD_RESET_REQUEST_MAX_AGE = 24 // max age in hours

const collectionName = "users"
const resetCollectionName = "pwd_reset_requests"

// Signup: create a new user account
func CreateUser(c echo.Context) error {
	var user models.User

	err := c.Bind(&user)
	if err != nil {
		return err
	}

	if user.Email == "" || user.Pwd == "" {
		return c.JSON(http.StatusBadRequest, web.ErrorResponse{Reason: "MISSING_PARAMETER"})
	}

	// TODO: check its an email.

	// Check for existing user with email

	coll := utils.Db.Collection(collectionName)
	filter := bson.D{{Key: "email", Value: user.Email}}

	var existingUser models.User
	err = coll.FindOne(context.TODO(), filter).Decode(&existingUser)
	if err == nil || err != mongo.ErrNoDocuments {
		return c.JSON(http.StatusBadRequest, web.ErrorResponse{Reason: "EMAIL_EXISTS"})
	}

	// hash password
	b_hashedhPwd, err := bcrypt.GenerateFromPassword([]byte(user.Pwd), BCRYPT_SALT_ROUNDS)
	if err != nil {
		fmt.Print(err)
		return c.JSON(http.StatusInternalServerError, web.ErrorResponse{Reason: "BCRYPT_ERROR"})
	}

	// populate object to insert
	user.Id = uuid.NewString()
	user.Pwd = string(b_hashedhPwd)
	user.Key = uuid.NewString()
	user.CreateDate = time.Now().UTC()
	user.LastUpdateDate = user.CreateDate

	_, err = coll.InsertOne(context.TODO(), user)
	if err != nil {
		fmt.Println("insert error", err)
		return c.JSON(http.StatusInternalServerError, web.ErrorResponse{Reason: "USER_CREATION_ERROR"})
	}

	user.Pwd = "" // set to default for removal from response
	return c.JSON(http.StatusOK, user)
}

// Check provided credentials match the user.
func SigninUser(c echo.Context) error {
	var params models.User

	err := c.Bind(&params)
	if err != nil {
		return err
	}

	if params.Email == "" || params.Pwd == "" {
		return c.JSON(http.StatusBadRequest, web.ErrorResponse{Reason: "MISSING_PARAMETER"})
	}

	coll := utils.Db.Collection(collectionName)
	filter := bson.D{{Key: "email", Value: params.Email}}

	var user models.User
	err = coll.FindOne(context.TODO(), filter).Decode(&user)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, web.ErrorResponse{Reason: "INVALID_CREDENTIALS"})
	}

	// // verify password
	err = bcrypt.CompareHashAndPassword([]byte(user.Pwd), []byte(params.Pwd))

	if err != nil {
		return c.JSON(http.StatusUnauthorized, web.ErrorResponse{Reason: "INVALID_CREDENTIALS"})
	}

	user.Pwd = ""
	return c.JSON(http.StatusOK, user)
}

// resets user password, following a reset request.
// TODO: reset password at any time, no need for request.
func SetUserPwd(c echo.Context) error {
	var params web.PwdResetRequest

	err := c.Bind(&params)
	if err != nil {
		return err
	}

	if params.Email == "" || params.Pwd == "" || params.RequestId == "" {
		return c.JSON(http.StatusBadRequest, web.ErrorResponse{Reason: "MISSING_PARAMETER"})
	}

	// make sure reset request is still valid
	maxAge := time.Now().UTC().Add(-time.Hour * PWD_RESET_REQUEST_MAX_AGE)

	coll := utils.Db.Collection(resetCollectionName)
	filter := bson.D{
		{Key: "$and",
			Value: bson.A{
				bson.D{{Key: "email", Value: params.Email}},
				bson.D{{Key: "createDate", Value: bson.D{{Key: "$gte", Value: maxAge}}}},
			},
		},
	}

	var resetRequest models.PwdResetRequest
	err = coll.FindOne(context.TODO(), filter).Decode(&resetRequest)
	if err != nil {
		return c.JSON(http.StatusNotFound, web.ErrorResponse{Reason: "ID_NOT_FOUND"})
	}

	// no need to check for email, it's necessarily the same since it's in the query's filter.

	// update user with new password
	newPwdHash, err := bcrypt.GenerateFromPassword([]byte(params.Pwd), BCRYPT_SALT_ROUNDS)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, web.ErrorResponse{Reason: "PWD_RESET_ERROR"})
	}

	filter = bson.D{{"email", resetRequest.Email}}
	update := bson.D{{"$set", bson.D{{"pwd", string(newPwdHash)}}}}
	opts := options.Update().SetUpsert(false)

	_, err = utils.Db.Collection(collectionName).UpdateOne(context.TODO(), filter, update, opts)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, web.ErrorResponse{Reason: "USER_UPDATE_ERROR"})
	}

	// deletes the now-useless reset request document
	_, err = utils.Db.Collection(resetCollectionName).DeleteOne(context.TODO(), bson.D{{"_id", resetRequest.Id}})
	if err != nil {
		fmt.Println("Error deleting reset request", resetRequest.Id)
	}

	return c.String(http.StatusNoContent, "")
}

func CreatePwdReset(c echo.Context) error {

	type Request struct {
		Email string `query:"email"`
	}

	var req Request
	err := c.Bind(&req)
	if err != nil {
		return c.String(http.StatusBadRequest, "bad request")
	}

	if req.Email == "" {
		return c.JSON(http.StatusBadRequest, web.ErrorResponse{Reason: "MISSING_PARAMETER"})
	}

	var user models.User
	err = utils.Db.Collection(collectionName).FindOne(context.TODO(), bson.D{{"email", req.Email}}).Decode(&user)
	if err != nil {
		return c.String(http.StatusNoContent, "")
	}

	//   try{
	utils.Db.Collection(resetCollectionName).InsertOne(context.TODO(), bson.D{
		{"_id", uuid.NewString()},
		{"email", user.Email},
		{"createDate", time.Now().UTC()},
	})

	// 	await MailSrv.send('PWD_RESET_REQUEST', req.params.email, {request_id: id})
	// 	res.send(204)
	// 	return next()
	//   }
	//   catch(ex){
	// 	logger.error('Pwd reset request error', ex)
	// 	res.send(500)
	// 	return next(false)
	//   }
	return c.String(http.StatusNoContent, "")
}

func GetPwdReset(c echo.Context) error {
	type Request struct {
		Id string `param:"id"`
	}

	var req Request
	err := c.Bind(&req)
	if err != nil {
		return c.String(http.StatusBadRequest, "bad request")
	}

	if req.Id == "" {
		return c.JSON(http.StatusBadRequest, web.ErrorResponse{Reason: "MISSING_PARAMETER"})
	}

	// make sure reset request is still valid
	maxAge := time.Now().UTC().Add(-time.Hour * PWD_RESET_REQUEST_MAX_AGE)
	var resReq models.PwdResetRequest
	err = utils.Db.Collection(resetCollectionName).FindOne(context.TODO(), bson.D{
		{"_id", req.Id},
		{"createDate", bson.D{{"$gte", maxAge}}},
	}).Decode(&resReq)

	if err != nil {
		return c.JSON(http.StatusNotFound, web.ErrorResponse{Reason: "ID_NOT_FOUND"})
	} else {
		return c.JSON(http.StatusOK, resReq)
	}
}
