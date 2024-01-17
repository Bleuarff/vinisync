package main

import (
	"fmt"
	"net/http"

	"time"

	"github.com/labstack/echo/v4"
)

func main() {
	fmt.Println("Hello world")

	e := echo.New()

	// Logger middleware
	e.Use(func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			fmt.Println(time.Now().UTC().Format(time.RFC3339), c.Request().Method, c.Request().URL.Path)
			return nil
		}
	})

	// Routes
	e.GET("/api/ping", Ping)

	e.Logger.Fatal(e.Start(":5136"))
}

func Ping(c echo.Context) error {
	fmt.Println("ping")
	return c.String(http.StatusOK, "pong")
}
