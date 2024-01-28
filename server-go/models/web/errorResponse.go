package web

// ErrorResponse represents the common object returned when the server cannot satisfy the request.
type ErrorResponse struct {
	// Error message key
	Reason string `json:"reason"`
}
