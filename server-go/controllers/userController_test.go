package controllers

import (
	"context"
	"log"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"
	"vinisync/server/utils"

	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
)

func TestMain(m *testing.M) {

	// set a temporary dbName
	dbName := "vni-test-" + time.Now().UTC().Format(time.RFC3339)
	log.Println("Use dbname", dbName)
	utils.Connect("mongodb://localhost:27018", dbName, 5*time.Second)

	exitVal := m.Run()

	log.Println("exitval", exitVal)
	// delete db if all tests pass
	if exitVal == 0 {
		utils.Db.Drop(context.TODO())
	}

	utils.Disconnect()

	os.Exit(exitVal)
}

// Creates dummy user user_test_1
func createUser(username string, pwd string) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodPut, "/api/user", strings.NewReader(`{"email":"`+username+`", "pwd":"`+pwd+`"}`))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	CreateUser(c)
}

func TestCreateUser(t *testing.T) {

	tests := []struct {
		name string
		json string
		code int
	}{
		{"New User", `{"email":"test_user_1", "pwd":"gabuzomeu"}`, 201},
		{"Missing password", `{"email":"test"}`, 400},
		{"Missing email", `{"pwd":"test"}`, 400},
		{"Duplicate email", `{"email":"test_user_1", "pwd":"gaboue"}`, 400},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			e := echo.New()
			req := httptest.NewRequest(http.MethodPut, "/api/user", strings.NewReader(tt.json))
			req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)

			rec := httptest.NewRecorder()
			c := e.NewContext(req, rec)

			CreateUser(c)

			assert.Equal(t, tt.code, rec.Code)
		})
	}
}

func TestSigninUser(t *testing.T) {
	tests := []struct {
		name string
		json string
		code int
	}{
		{"ok", `{"email":"test-signin-user", "pwd":"coincoin"}`, 200},
		{"no email", `{"pwd":"coin"}`, 400},
		{"no pwd", `{"email":"test-signin-user"}`, 400},
		{"wrong pwd", `{"email":"test-signin-user", "pwd":"wrong_password"}`, 401},
		{"invalid email", `{"email":"invalid_email", "pwd":"random"}`, 401},
	}

	createUser("test-signin-user", "coincoin")

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			e := echo.New()
			req := httptest.NewRequest(http.MethodPost, "/api/signin", strings.NewReader(tt.json))
			req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)

			rec := httptest.NewRecorder()
			c := e.NewContext(req, rec)

			SigninUser(c)

			assert.Equal(t, tt.code, rec.Code)
		})
	}
}
