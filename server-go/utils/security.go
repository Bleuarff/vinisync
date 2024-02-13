package utils

import (
	"context"
	"crypto/hmac"
	"crypto/sha512"
	"encoding/base64"
	"fmt"
	"net/http"
	"strings"
	"time"
	"vinisync/server/models"

	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type VerifyError struct {
	Status int
	Reason string
}

// max allowed diff between request timestamp and server time, in minutes.
// necessary to avoid replay attacks.
const maxDrift = 100000

// checks date & auth are valid:
// date must be around server time
// compute signature and check its the same as auth
func Verify(c echo.Context, userId string) *VerifyError {

	// check the dateHeader header is ok (within _maxDrift_ minutes of server time)
	dateHeader := c.Request().Header.Get("X-Date")

	if dateHeader == "" {
		return &VerifyError{Status: http.StatusBadRequest, Reason: "INVALID_DATE_HEADER"}
	}

	date, err := time.Parse(time.RFC3339, dateHeader)

	if err != nil {
		return &VerifyError{Status: http.StatusBadRequest, Reason: "INVALID_DATE_HEADER"}
	}

	// check time is within acceptable window
	offset := time.Since(date).Abs().Minutes()

	if offset > maxDrift {
		fmt.Println("Max drift exceeded")
		return &VerifyError{Status: http.StatusBadRequest, Reason: "INVALID_DATE_HEADER"}
	}

	// check there is a auth header
	signature := c.Request().Header.Get("Authorization")

	if signature == "" { // TODO: add check for signature length
		return &VerifyError{Status: http.StatusUnauthorized, Reason: "MISSING_AUTH_HEADER"}
	}
	signatureMAC, err := base64.StdEncoding.DecodeString(signature)

	if err != nil {
		return &VerifyError{Status: http.StatusUnauthorized, Reason: "INVALID_AUTH_HEADER"}
	}

	// check there is a userid in params
	if userId == "" {
		return &VerifyError{Status: http.StatusUnauthorized, Reason: "MISSING_USER_ID"}
	}

	// fetch user
	var user models.User
	options := options.FindOne().SetProjection(bson.D{{Key: "key", Value: 1}})
	err = Db.Collection("users").FindOne(
		context.TODO(),
		bson.D{{Key: "_id", Value: userId}},
		options,
	).Decode(&user)

	if err != nil {
		return &VerifyError{Status: http.StatusUnauthorized, Reason: "INVALID_USER_ID"}
	}
	// fmt.Println("User", user)

	// get input
	// const input = [req.method, req.getPath(), date, req._body || req.body, req.getQuery()].join('\n')
	req := c.Request()
	inputs := []string{
		req.Method,
		req.URL.Path,
		dateHeader,
		"",
		req.URL.RawQuery,
	}
	input := strings.Join(inputs, "\n")

	mac := hmac.New(sha512.New384, []byte(user.Key))
	mac.Write([]byte(input))
	expectedMac := mac.Sum(nil)
	allgood := hmac.Equal(expectedMac, signatureMAC)

	if !allgood {
		return &VerifyError{Status: http.StatusForbidden, Reason: "INCORRECT_AUTHENTICATION"}
	}
	return nil
}
