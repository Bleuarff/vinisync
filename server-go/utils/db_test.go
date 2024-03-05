package utils

import (
	"testing"
	"time"
)

var inputs = []struct {
	connString  string
	timeout     uint
	expectError bool
}{
	{"mongodb://localhost:27018", 0, false},
	{"mongodb://localhost:27018", 1, false},
	{"mongodb://localhost:27019", 1, true},
}

func TestConnect(t *testing.T) {

	for _, tt := range inputs {

		t.Run(tt.connString, func(t *testing.T) {

			err := Connect(tt.connString, "vinisync", time.Duration(tt.timeout)*time.Second)

			if !tt.expectError && err != nil {
				t.Errorf("Cannot connect to DB '%s'", tt.connString)
			} else if tt.expectError && err == nil {
				t.Errorf("Error expected for '%s'", tt.connString)
			}
		})
	}
}
func TestDisconnect(t *testing.T) {
	err := Disconnect()
	if err != nil {
		t.Error("Error disconnecting from DB")
	}
}
