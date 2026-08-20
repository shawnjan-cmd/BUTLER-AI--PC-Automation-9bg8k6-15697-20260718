"""
Butler AI - AST Symbol Slicing Utility
Extracts specific functions or classes from Python source files for AI context minimization.
"""

import sys
import ast

def slice_file_symbol(filepath: str, symbol_name: str) -> str:
    """Parses a python file and returns the source code of the requested function or class."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        tree = ast.parse(content, filename=filepath)
    except Exception as e:
        return f"Error reading or parsing file: {e}"

    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.ClassDef)) and node.name == symbol_name:
            segment = ast.get_source_segment(content, node)
            if segment:
                return segment
    return f"Symbol '{symbol_name}' not found in {filepath}."
