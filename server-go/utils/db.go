// Package utils contains various non-business logic pieces of reusable code, and global
// variables like the mongo client.
package utils

import (
	"context"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// Proxy for mongo vinisync db access
var Db *mongo.Database
var client *mongo.Client

// Connects to the mongo db instance at connectionString.
func Connect(connectionString string, timeout time.Duration) error {

	// default timeout
	if timeout == 0 {
		timeout = 30 * time.Second
	}

	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	clientOpts := options.Client().ApplyURI(connectionString)
	client, err := mongo.Connect(ctx, clientOpts)

	if err != nil {
		return err
	}
	err = client.Ping(ctx, nil)
	if err != nil {
		return err
	} else {
		fmt.Println("MongoDb connection OK")
		Db = client.Database("vinisync")
		return nil
	}
}

func Disconnect() error {
	if client == nil {
		return nil
	}

	err := client.Disconnect(context.TODO())
	return err
}
