package models

import "time"

type PwdResetRequest struct {
	Id         string    `bson:"_id"`
	Email      string    `bson:"email"`
	CreateDate time.Time `bson:"createDate"`
}
