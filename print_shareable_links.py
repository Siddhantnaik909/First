#!/usr/bin/env python3
"""
Print Shareable Links from Smart Hub Project
Reads URLs from other/urls.txt and prints valid http links to console.
Usage: python print_shareable_links.py
"""

import re
import os

def is_valid_url(line):
    """Check if line starts with http:// or https://"""
    stripped = line.strip()
    return stripped.startswith('http://') or stripped.startswith('https://')

def main():
    urls_file = 'other/urls.txt'
    
    if not os.path.exists(urls_file):
        print(f"Error: {urls_file} not found!")
        return
    
    print("=== Smart Hub Shareable Links ===\n")
    count = 0
    
    try:
        with open(urls_file, 'r', encoding='utf-8') as f:
            for line_num, line in enumerate(f, 1):
                line = line.rstrip('\n')
                stripped_line = line.strip()
                if 'http://localhost:3000' in stripped_line:
                    # Extract URL after '-', space, or tab
                    clean_url = stripped_line.split('-', 1)[-1].strip() if stripped_line.startswith('-') else stripped_line
                    print(clean_url)
                    count += 1
                elif line.startswith('==='):  # Print category headers
                    print(f"\n{line}")
        
        print(f"\n=== Total URLs printed: {count} ===")
        
    except Exception as e:
        print(f"Error reading file: {e}")

if __name__ == "__main__":
    main()

