package controllers

import (
	"net/http"
	"vinisync/server/models/web"
	"vinisync/server/utils"

	"github.com/labstack/echo/v4"
)

func GetUpdates(c echo.Context) error {

	var params web.UpdateRequest

	if err := c.Bind(&params); err != nil {
		return c.JSON(http.StatusBadRequest, web.ErrorResponse{Reason: "INVALID_PARAMETERS"})
	}

	if err := utils.Verify(c, params.UserId); err != nil {
		return c.JSON(err.Status, web.ErrorResponse{Reason: err.Reason})
	}
	return c.JSON(http.StatusNotImplemented, web.ErrorResponse{Reason: "NOT_IMPLEMENTED"})
}
