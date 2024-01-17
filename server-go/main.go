package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"

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
	if err := e.Shutdown(ctx); err != nil {
		e.Logger.Fatal(err)
	}
	fmt.Println("Server shutting down")
}

func Ping(c echo.Context) error {
	fmt.Println("ping")
	return c.String(http.StatusOK, "pong")
}
