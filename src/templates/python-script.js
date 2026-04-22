/**
 * Python Data Processing Script Template
 * Looks like a legitimate Python script for data analysis.
 */

module.exports = {
  header: `#!/usr/bin/env python3
"""
Data Pipeline: CSV to JSON Converter
=====================================

A simple utility script for converting CSV files to JSON format.
Used in the data ingestion pipeline for the analytics dashboard.

Author: dev-team
Date: 2023-11-15
"""

import csv
import json
import sys
from pathlib import Path
from typing import List, Dict, Any

`,
  sections: [
    `DEFAULT_ENCODING = 'utf-8'
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB

class CSVConverter:
    """Handles CSV to JSON conversion with validation."""
    
    def __init__(self, encoding: str = DEFAULT_ENCODING):
        self.encoding = encoding
        self.errors = []
    
    def validate_file(self, filepath: Path) -> bool:
        """Check if file exists and is within size limits."""
        if not filepath.exists():
            self.errors.append(f"File not found: {filepath}")
            return False
        if filepath.stat().st_size > MAX_FILE_SIZE:
            self.errors.append(f"File too large: {filepath}")
            return False
        return True
    
    def read_csv(self, filepath: Path) -> List[Dict[str, Any]]:
        """Read CSV file and return list of dictionaries."""
        rows = []
        with open(filepath, 'r', encoding=self.encoding) as f:
            reader = csv.DictReader(f)
            for row in reader:
                rows.append(self._clean_row(row))
        return rows
    
    def _clean_row(self, row: Dict[str, str]) -> Dict[str, Any]:
        """Clean and type-convert row values."""
        cleaned = {}
        for key, value in row.items():
            cleaned[key.strip()] = self._convert_type(value.strip())
        return cleaned

`,
    `    def _convert_type(self, value: str) -> Any:
        """Attempt to convert string to appropriate type."""
        if value.lower() in ('true', 'yes', '1'):
            return True
        if value.lower() in ('false', 'no', '0'):
            return False
        if value == '' or value.lower() == 'null':
            return None
        try:
            return int(value)
        except ValueError:
            pass
        try:
            return float(value)
        except ValueError:
            pass
        return value

`,
    `    def convert(self, input_path: Path, output_path: Path = None) -> str:
        """Main conversion method."""
        if not self.validate_file(input_path):
            raise ValueError(f"Validation failed: {'; '.join(self.errors)}")
        
        data = self.read_csv(input_path)
        
        result = {
            'source': str(input_path),
            'record_count': len(data),
            'records': data
        }
        
        if output_path:
            with open(output_path, 'w', encoding=self.encoding) as f:
                json.dump(result, f, indent=2, ensure_ascii=False)
        
        return json.dumps(result, indent=2, ensure_ascii=False)

`,
    `def main():
    """CLI entry point."""
    if len(sys.argv) < 2:
        print("Usage: python csv_converter.py <input.csv> [output.json]")
        sys.exit(1)
    
    input_file = Path(sys.argv[1])
    output_file = Path(sys.argv[2]) if len(sys.argv) > 2 else None
    
    converter = CSVConverter()
    
    try:
        result = converter.convert(input_file, output_file)
        if not output_file:
            print(result)
        else:
            print(f"Converted {input_file} -> {output_file}")
            print(f"Records: {len(json.loads(result)['records'])}")
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

`,
    `if __name__ == '__main__':
    main()

# TODO: Add support for Excel files
# TODO: Implement streaming for large files
# TODO: Add schema validation
`
  ],
  footer: `\n# End of script\n`,
  slots: 5
};
