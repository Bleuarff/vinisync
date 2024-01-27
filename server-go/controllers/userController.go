package controllers

import (
	"context"
	"fmt"
	"net/http"
	"time"
	"vinisync/server/models"
	"vinisync/server/utils"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"
)

const BCRYPT_SALT_ROUNDS = 10

// Signup: create a new user account
func CreateUser(c echo.Context) error {
	var user models.User

	err := c.Bind(&user)
	if err != nil {
		return err
	}

	if user.Email == "" || user.Pwd == "" {
		return c.JSON(http.StatusBadRequest, models.ErrorResponse{Reason: "MISSING_PARAMETER"})
	}

	// TODO: check its an email.

	// Check for existing user with email

	coll := utils.Db.Collection("users")
	filter := bson.D{{Key: "email", Value: user.Email}}

	var existingUser models.User
	err = coll.FindOne(context.TODO(), filter).Decode(&existingUser)
	if err == nil || err != mongo.ErrNoDocuments {
		return c.JSON(http.StatusBadRequest, models.ErrorResponse{Reason: "EMAIL_EXISTS"})
	}

	// hash password
	b_hashedhPwd, err := bcrypt.GenerateFromPassword([]byte(user.Pwd), BCRYPT_SALT_ROUNDS)
	if err != nil {
		fmt.Print(err)
		return c.JSON(http.StatusInternalServerError, models.ErrorResponse{Reason: "BCRYPT_ERROR"})
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
		return c.JSON(http.StatusInternalServerError, models.ErrorResponse{Reason: "USER_CREATION_ERROR"})
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
		return c.JSON(http.StatusBadRequest, models.ErrorResponse{Reason: "MISSING_PARAMETER"})
	}

	coll := utils.Db.Collection("users")
	filter := bson.D{{Key: "email", Value: params.Email}}

	var user models.User
	err = coll.FindOne(context.TODO(), filter).Decode(&user)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, models.ErrorResponse{Reason: "INVALID_CREDENTIALS"})
	}

	// // verify password
	err = bcrypt.CompareHashAndPassword([]byte(user.Pwd), []byte(params.Pwd))

	if err != nil {
		return c.JSON(http.StatusUnauthorized, models.ErrorResponse{Reason: "INVALID_CREDENTIALS"})
	}

	user.Pwd = ""
	return c.JSON(http.StatusOK, user)
}
