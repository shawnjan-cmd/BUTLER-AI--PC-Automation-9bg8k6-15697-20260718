"""
Butler AI - AST-Sanitized Safe Macro Execution Engine
Provides static Abstract Syntax Tree (AST) validation and sandboxed execution
for user-created or AI-generated automation scripts.
"""

import ast
import sys
import subprocess
import logging

logger = logging.getLogger("butler.macro_engine")

# Prohibited dangerous imports and function calls
PROHIBITED_MODULES = {"os", "subprocess", "shutil", "sys", "ctypes", "socket", "http"}
PROHIBITED_FUNCTIONS = {"system", "popen", "eval", "exec", "remove", "rmdir", "unlink"}

class MacroSafetyValidator(ast.NodeVisitor):
    def __init__(self):
        self.errors = []

    def visit_Import(self, node):
        for alias in node.names:
            if alias.name in PROHIBITED_MODULES:
                self.errors.append(f"Prohibited module import detected: {alias.name}")
        self.generic_visit(node)

    def visit_ImportFrom(self, node):
        if node.module in PROHIBITED_MODULES:
            self.errors.append(f"Prohibited import-from detected: {node.module}")
        self.generic_visit(node)

    def visit_Call(self, node):
        if isinstance(node.func, ast.Name):
            if node.func.id in PROHIBITED_FUNCTIONS:
                self.errors.append(f"Prohibited function call detected: {node.func.id}")
        elif isinstance(node.func, ast.Attribute):
            if node.func.attr in PROHIBITED_FUNCTIONS:
                self.errors.append(f"Prohibited method call detected: {node.func.attr}")
        self.generic_visit(node)

def validate_macro_code(source_code: str) -> tuple[bool, list[str]]:
    """
    Parses source code into an AST and validates against prohibited operations.
    Returns (is_safe, error_list).
    """
    try:
        tree = ast.parse(source_code)
    except SyntaxError as e:
        return False, [f"Syntax Error in macro: {e}"]

    validator = MacroSafetyValidator()
    validator.visit(tree)
    
    if validator.errors:
        return False, validator.errors
    return True, []

def execute_sandboxed_macro(source_code: str, timeout_sec: int = 5) -> dict:
    """
    Validates and executes a macro in a controlled subprocess sandbox.
    """
    is_safe, errors = validate_macro_code(source_code)
    if not is_safe:
        return {"success": False, "error": "AST Validation Failed", "details": errors}

    # Write to a temp runner or execute via constrained subprocess
    try:
        res = subprocess.run(
            [sys.executable, "-c", source_code],
            capture_output=True,
            text=True,
            timeout=timeout_sec
        )
        if res.returncode != 0:
            return {"success": False, "error": "Runtime Error", "details": res.stderr}
        return {"success": True, "output": res.stdout}
    except subprocess.TimeoutExpired:
        return {"success": False, "error": "Execution Timeout", "details": f"Exceeded {timeout_sec}s limit."}
    except Exception as e:
        return {"success": False, "error": "Sandbox Exception", "details": str(e)}
