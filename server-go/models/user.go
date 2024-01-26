// Package models contains all types used by server.
package models

import "time"

// User represents an account on the service.
type User struct {
	Id             string `bson:"_id"`
	Email          string `json:"email"`
	Pwd            string `json:"pwd"`
	Key            string
	CreateDate     time.Time
	LastUpdateDate time.Time
}
