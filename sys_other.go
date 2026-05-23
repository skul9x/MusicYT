//go:build !windows

package main

import "os/exec"

// prepareCommand không làm gì trên các hệ điều hành khác ngoài Windows
func prepareCommand(cmd *exec.Cmd) {
	// Không có cửa sổ console đen trên Linux/macOS
}
