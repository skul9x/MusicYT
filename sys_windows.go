//go:build windows

package main

import (
	"os/exec"
	"syscall"
)

// prepareCommand ẩn cửa sổ console đen của tiến trình con trên Windows
func prepareCommand(cmd *exec.Cmd) {
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
}
