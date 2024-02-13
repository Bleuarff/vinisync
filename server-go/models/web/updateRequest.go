package web

import "time"

type UpdateRequest struct {
	UserId   string    `query:"userid"`
	DeviceId string    `query:"devid"`
	LastSync time.Time `query:"lastSync"`
	Page     int       `query:"page"`
}
