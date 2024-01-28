package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"vinisync/server/controllers"
	"vinisync/server/utils"

	"time"

	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/mongo"
)

var client *mongo.Client

func main() {
	fmt.Println("Vinisync server  - Go edition")

	err := utils.Connect("mongodb://localhost:27018")
	if err != nil {
		log.Fatal(err)
	}

	e := echo.New()

	// Logger middleware
	e.Use(func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			fmt.Println(time.Now().UTC().Format(time.RFC3339), c.Request().Method, c.Request().URL.Path)
			return next(c)
		}
	})

	e.Use(SetDefaultHeaders)

	// Routes
	e.GET("/api/ping", Ping)
	e.PUT("/api/user", controllers.CreateUser)
	e.POST("/api/signin", controllers.SigninUser)
	e.POST("/api/user/pwd", controllers.SetUserPwd)

	e.POST("/api/pwdreset", controllers.CreatePwdReset)
	e.GET("/api/pwdreset/:id", controllers.GetPwdReset)

	go func() {
		if err := e.Start(":5136"); err != nil && err != http.ErrServerClosed {
			e.Logger.Fatal("shutting down the server")
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server with a timeout of 10 seconds.
	// Use a buffered channel to avoid missing signals as recommended for signal.Notify
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt)
	<-quit
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	err = client.Disconnect(context.TODO())
	if err != nil {
		e.Logger.Error(err)
	} else {
		e.Logger.Print("Mongo connection closed OK")
	}
	if err = e.Shutdown(ctx); err != nil {
		e.Logger.Fatal(err)
	}
	fmt.Println("Server shutting down")
}

func Ping(c echo.Context) error {
	fmt.Println("ping")
	return c.String(http.StatusOK, "pong")
}

func SetDefaultHeaders(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		c.Response().Header().Set("Access-Control-Allow-Origin", "*")
		c.Response().Header().Set("Access-Control-Allow-Credentials", "true")
		c.Response().Header().Set("Access-Control-Expose-Headers", "Content-Length")
		c.Response().Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")

		if c.Request().Method == "OPTIONS" {
			c.Response().Header().Set("Access-Control-Allow-Methods", "GET, HEAD, POST, PUT, DELETE")
			c.Response().Header().Set("Access-Control-Allow-Headers", "Date, X-Date, Authorization, Content-Type, X-Auth")
		}
		return next(c)
	}
}
