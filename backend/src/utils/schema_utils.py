"""
Schema utilities for cleaning JSON schemas for Vertex AI compatibility.
"""

from typing import Dict, Any, Set


def clean_schema_for_vertex_ai(schema: Dict[str, Any]) -> Dict[str, Any]:
    """
    Clean a Pydantic JSON schema to be compatible with Vertex AI.
    
    Vertex AI doesn't support the $defs field, so we need to inline
    all definitions directly into the schema by replacing $ref references.
    
    Args:
        schema: JSON schema from Pydantic model_json_schema()
    
    Returns:
        Cleaned schema without $defs, with all definitions inlined
    """
    if not isinstance(schema, dict):
        return schema
    
    # Create a deep copy to avoid modifying the original
    import copy
    cleaned = copy.deepcopy(schema)
    
    # Extract definitions if they exist
    definitions = cleaned.pop("$defs", {})
    
    if not definitions:
        # No definitions to inline, just remove any $defs keys and convert anyOf
        cleaned = _remove_defs_keys(cleaned)
        cleaned = _convert_anyof(cleaned)
        return cleaned
    
    # Recursively inline all $ref references
    def inline_refs(obj: Any, defs: Dict[str, Any], visited: Set[str] = None) -> Any:
        """Recursively replace $ref with actual definitions."""
        if visited is None:
            visited = set()
            
        if isinstance(obj, dict):
            if "$ref" in obj:
                # Extract the reference key (e.g., "#/$defs/ContactInfo" -> "ContactInfo")
                ref_path = obj["$ref"]
                if ref_path.startswith("#/$defs/"):
                    ref_key = ref_path.replace("#/$defs/", "")
                    if ref_key in defs:
                        # Prevent circular references
                        if ref_key in visited:
                            # Return a simple object type to break the cycle
                            return {"type": "object"}
                        visited.add(ref_key)
                        
                        # Get the definition and recursively inline any nested refs
                        definition = copy.deepcopy(defs[ref_key])
                        result = inline_refs(definition, defs, visited)
                        visited.remove(ref_key)
                        return result
                # If ref doesn't match our pattern, return as-is
                return obj
            else:
                # Recursively process all values
                return {k: inline_refs(v, defs, visited) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [inline_refs(item, defs, visited) for item in obj]
        else:
            return obj
    
    # Inline all references in the schema
    cleaned = inline_refs(cleaned, definitions)
    
    # Remove any remaining $defs keys that might be nested
    cleaned = _remove_defs_keys(cleaned)
    
    # Convert anyOf to Vertex AI compatible format
    cleaned = _convert_anyof(cleaned)
    
    return cleaned


def _remove_defs_keys(obj: Any) -> Any:
    """Recursively remove $defs keys from schema."""
    if isinstance(obj, dict):
        result = {}
        for k, v in obj.items():
            if k != "$defs":
                result[k] = _remove_defs_keys(v)
        return result
    elif isinstance(obj, list):
        return [_remove_defs_keys(item) for item in obj]
    else:
        return obj


def _convert_anyof(obj: Any) -> Any:
    """
    Convert anyOf to Vertex AI compatible format.
    
    Vertex AI doesn't support anyOf. For Optional fields, Pydantic generates:
    anyOf: [{"type": "string"}, {"type": "null"}]
    
    We convert this to just the non-null type, making it effectively optional
    by not requiring it in the schema.
    """
    if isinstance(obj, dict):
        if "anyOf" in obj:
            anyof_list = obj["anyOf"]
            # Find the non-null type
            non_null_type = None
            has_null = False
            
            for option in anyof_list:
                if isinstance(option, dict):
                    if option.get("type") == "null":
                        has_null = True
                    else:
                        non_null_type = option
            
            # If we have a non-null type and null, use the non-null type
            # and mark as nullable if Vertex AI supports it
            if non_null_type and has_null:
                # Recursively process the non-null type
                result = _convert_anyof(non_null_type.copy())
                # Note: Vertex AI Schema doesn't have explicit nullable, 
                # but optional fields are handled by not being required
                return result
            elif non_null_type:
                # Just use the non-null type
                return _convert_anyof(non_null_type)
            else:
                # Fallback: use first option
                return _convert_anyof(anyof_list[0]) if anyof_list else {}
        
        # Recursively process all values
        return {k: _convert_anyof(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [_convert_anyof(item) for item in obj]
    else:
        return obj

