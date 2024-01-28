package web

type PwdResetRequest struct {
	Email     string `json:"email"`
	Pwd       string `json:"pwd"`
	RequestId string `json:"reqid"`
}
