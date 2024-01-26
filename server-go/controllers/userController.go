package controllers

import (
	"context"
	"fmt"
	"net/http"
	"vinisync/server/models"
	"vinisync/server/utils"

	// "vinisync/server/models"

	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

func CreateUser(c echo.Context) error {
	var user models.User

	err := c.Bind(&user)
	if err != nil {
		return err
	}

	fmt.Println("create user", user.Email, user.Pwd)

	if user.Email == "" || user.Pwd == "" {
		return c.JSON(http.StatusBadRequest, models.ErrorResponse{Reason: "MISSING_PARAMETER"})
	}

	filter := bson.D{{Key: "email", Value: user.Email}}
	var existingUser models.User
	err = utils.Db.Collection("users").FindOne(context.TODO(), filter).Decode(&existingUser)
	if err == nil || err != mongo.ErrNoDocuments {
		// fmt.Print("User exists", user.Email)
		return c.JSON(http.StatusBadRequest, models.ErrorResponse{Reason: "EMAIL_EXISTS"})
	}

	// 	const hash = await bcrypt.hash(req.params.pwd, BCRYPT_SALT_ROUNDS),
	// 		  now = DateTime.utc().toBSON()

	// 	user = {
	// 	  _id: uuid.v4(),
	// 	  email: req.params.email,
	// 	  pwd: hash,
	// 	  key: uuid.v4(),
	// 	  createDate: now,
	// 	  lastUpdateDate: now
	// 	}

	// 	await db.collection(COLLECTION_NAME).insertOne(user)

	// 	// prepare response object
	// 	user.id = user._id
	// 	delete user.pwd
	// 	delete user._id

	// 	res.send(201, user)
	// 	return next()
	//   }
	//   catch(ex){
	// 	logger.error('Creation error', ex)
	// 	res.send(500)
	// 	return next(false)
	//   }
	return c.String(http.StatusOK, "user creation... NOT OK")
}
