// Package models contains all types used by server.
package models

import "time"

// User represents an account on the service.
type User struct {
	Id             string    `json:"id" bson:"_id"`
	Email          string    `json:"email"`
	Pwd            string    `json:"pwd,omitempty"`
	Key            string    `json:"key"`
	CreateDate     time.Time `json:"createDate"`
	LastUpdateDate time.Time `json:"lastUpdateDate"`
}
