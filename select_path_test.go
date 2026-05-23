package main

import (
	"context"
	"os"
	"strings"
	"testing"
)

func TestIsAppReady(t *testing.T) {
	app := NewApp()

	// Initial state: not ready, ctx is nil
	if app.IsAppReady() {
		t.Error("Expected IsAppReady to be false initially")
	}

	// Setup context but ready is still false
	ctx := context.Background()
	app.startup(ctx)
	if app.IsAppReady() {
		t.Error("Expected IsAppReady to be false after startup but before domReady")
	}

	// Trigger domReady
	app.domReady(ctx)
	if !app.IsAppReady() {
		t.Error("Expected IsAppReady to be true after startup and domReady")
	}
}

func TestSelectSavePath_PanicRecovery(t *testing.T) {
	app := NewApp()
	ctx := context.Background()
	app.startup(ctx)
	app.domReady(ctx)

	// Enable panic injection
	app.selectPathPanicForTest = true

	result, err := app.SelectSavePath("")
	if err == nil {
		t.Error("Expected error from recovered panic, got nil")
	} else if !strings.Contains(err.Error(), "không thể mở hộp thoại chọn thư mục: simulated COM thread panic") {
		t.Errorf("Expected error to contain the panic message, got: %v", err)
	}

	if result != "" {
		t.Errorf("Expected result to be empty on panic, got: %s", result)
	}
}

func TestSelectSavePath_DefaultDirectory(t *testing.T) {
	app := NewApp()
	ctx := context.WithValue(context.Background(), "is_test", true)
	app.startup(ctx)
	app.domReady(ctx)

	// Call with a valid directory
	cwd, err := os.Getwd()
	if err != nil {
		t.Fatalf("Failed to get current directory: %v", err)
	}

	result, errVal := app.SelectSavePath(cwd)
	if errVal != nil {
		t.Errorf("Expected nil error under test bypass, got: %v", errVal)
	}
	if result != "/mock/path" {
		t.Errorf("Expected result to be '/mock/path', got: %s", result)
	}
	if app.lastResolvedDefaultDir != cwd {
		t.Errorf("Expected lastResolvedDefaultDir to be '%s', got: '%s'", cwd, app.lastResolvedDefaultDir)
	}

	// Call with an invalid directory
	result2, errVal2 := app.SelectSavePath("non_existent_directory_xyz_123")
	if errVal2 != nil {
		t.Errorf("Expected nil error under test bypass, got: %v", errVal2)
	}
	if result2 != "/mock/path" {
		t.Errorf("Expected result to be '/mock/path', got: %s", result2)
	}
	expectedFallback := app.GetDefaultSavePath()
	if app.lastResolvedDefaultDir != expectedFallback {
		t.Errorf("Expected lastResolvedDefaultDir to fallback to '%s', got: '%s'", expectedFallback, app.lastResolvedDefaultDir)
	}
}
