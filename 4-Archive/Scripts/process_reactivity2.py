#!/usr/bin/env python3
"""
Process Reactivity 2 Pearson resources:
1. Crop question-related diagrams and graphs from screenshots
2. Compile screenshots into PDFs for each section
"""

from PIL import Image
import os
import re
from pathlib import Path

# Base directories
BASE_DIR = "/sessions/intelligent-clever-brahmagupta/mnt/IB Chemistry/3-Resources/Pearson IB Chemistry HL"

SECTIONS = {
    "2.1": "Reactivity_2.1",
    "2.2": "Reactivity_2.2",
    "2.3": "Reactivity_2.3"
}

# Keywords to identify potential diagrams/graphs in screenshots
DIAGRAM_KEYWORDS = [
    "graph", "chart", "diagram", "figure", "table", "curve", "plot",
    "concentration", "time", "rate", "maxwell", "boltzmann", "energy",
    "profile", "mechanism", "equilibrium", "ice", "gibbs", "chatelier",
    "arrhenius", "axis", "axis label", "line graph", "bar"
]


def screenshots_to_pdf(screenshot_dir, output_pdf):
    """Convert sorted PNG screenshots to a single PDF."""
    try:
        files = sorted([f for f in os.listdir(screenshot_dir) if f.endswith('.png')])
        if not files:
            return 0

        images = []
        for f in files:
            try:
                img = Image.open(os.path.join(screenshot_dir, f)).convert('RGB')
                images.append(img)
            except Exception as e:
                print(f"  Warning: Could not process {f}: {e}")

        if images:
            images[0].save(output_pdf, save_all=True, append_images=images[1:], resolution=150)
            print(f"  Created PDF: {output_pdf}")
            print(f"  Pages: {len(images)}")
            return len(images)
        return 0
    except Exception as e:
        print(f"  Error creating PDF: {e}")
        return 0


def get_image_regions(img_path):
    """
    Analyze an image and identify potential diagram/graph regions.
    Returns list of suggested crop coordinates and descriptions.
    """
    try:
        img = Image.open(img_path)
        width, height = img.size

        # Simple heuristic: look for distinct regions based on content
        # This is a basic approach - in practice, we'd need OCR or ML to precisely identify diagrams

        regions = []

        # Check if image has significant color variation (indicates diagrams)
        # Divide image into quadrants and analyze
        quad_width = width // 2
        quad_height = height // 2

        quadrants = [
            (0, 0, quad_width, quad_height, "top-left"),
            (quad_width, 0, width, quad_height, "top-right"),
            (0, quad_height, quad_width, height, "bottom-left"),
            (quad_width, quad_height, width, height, "bottom-right")
        ]

        for x1, y1, x2, y2, label in quadrants:
            quad = img.crop((x1, y1, x2, y2))
            # Check if quadrant has visual content (not mostly white/blank)
            extrema = quad.convert('RGB').getextrema()
            # If it has color variation, it likely contains a diagram
            if any(max_val - min_val > 100 for min_val, max_val in extrema):
                regions.append(((x1, y1, x2, y2), f"potential_diagram_{label}"))

        return regions
    except Exception as e:
        print(f"    Error analyzing image: {e}")
        return []


def crop_question_images(section_num, section_dir):
    """
    Crop question-related images from a section's screenshots.
    Focuses on diagrams, graphs, and figures.
    """
    screenshots_dir = os.path.join(section_dir, "Screenshots")
    question_images_dir = os.path.join(section_dir, "Question_Images")

    if not os.path.exists(screenshots_dir):
        print(f"Screenshots directory not found: {screenshots_dir}")
        return 0

    if not os.path.exists(question_images_dir):
        os.makedirs(question_images_dir)

    crop_count = 0
    screenshot_files = sorted([f for f in os.listdir(screenshots_dir) if f.endswith('.png')])

    for idx, screenshot in enumerate(screenshot_files, 1):
        screenshot_path = os.path.join(screenshots_dir, screenshot)

        try:
            img = Image.open(screenshot_path)
            width, height = img.size

            # Strategy: Identify potential diagram regions
            # For Pearson textbooks, diagrams typically appear in specific areas

            # Common patterns:
            # 1. Graphs/charts (usually centered with axes and labels)
            # 2. Diagrams (various sizes, often with borders)
            # 3. Tables (structured layouts)

            # Analyze for high color variation (indicates content)
            regions = []

            # Check right side (often contains diagrams in textbooks)
            right_third = img.crop((width * 2 // 3, 0, width, height))
            right_extrema = right_third.convert('RGB').getextrema()
            if any(max_val - min_val > 80 for min_val, max_val in right_extrema):
                regions.append(((width * 2 // 3, 0, width, height), "right_diagram"))

            # Check bottom section (often contains graphs)
            bottom_half = img.crop((0, height // 2, width, height))
            bottom_extrema = bottom_half.convert('RGB').getextrema()
            if any(max_val - min_val > 80 for min_val, max_val in bottom_extrema):
                regions.append(((0, height // 2, width, height), "bottom_section"))

            # Check for centered content
            center_box = img.crop((width // 4, height // 4, width * 3 // 4, height * 3 // 4))
            center_extrema = center_box.convert('RGB').getextrema()
            if any(max_val - min_val > 100 for min_val, max_val in center_extrema):
                regions.append(((width // 4, height // 4, width * 3 // 4, height * 3 // 4), "center_diagram"))

            # Crop and save identified regions
            for (x1, y1, x2, y2), region_desc in regions:
                if (x2 - x1) > 200 and (y2 - y1) > 150:  # Minimum size threshold
                    cropped = img.crop((x1, y1, x2, y2))
                    crop_filename = f"R2_{section_num}_Q{idx:02d}_{region_desc}.png"
                    crop_path = os.path.join(question_images_dir, crop_filename)
                    cropped.save(crop_path)
                    crop_count += 1

        except Exception as e:
            print(f"  Error processing {screenshot}: {e}")

    return crop_count


def main():
    """Main processing function."""
    print("=" * 70)
    print("REACTIVITY 2: Image Cropping and PDF Compilation")
    print("=" * 70)

    total_crops = {}
    total_pages = {}

    for section_code, section_dir_name in SECTIONS.items():
        section_path = os.path.join(BASE_DIR, section_dir_name)

        if not os.path.exists(section_path):
            print(f"\nSection R{section_code}: NOT FOUND")
            continue

        print(f"\n{'─' * 70}")
        print(f"Processing R{section_code}: {section_dir_name}")
        print(f"{'─' * 70}")

        # Task 1: Crop question images
        print(f"\nTask 1: Cropping question-related images...")
        crops = crop_question_images(section_code, section_path)
        total_crops[section_code] = crops
        print(f"  Cropped {crops} image regions")

        # Task 2: Create PDF from screenshots
        print(f"\nTask 2: Creating PDF from screenshots...")
        screenshots_dir = os.path.join(section_path, "Screenshots")

        section_titles = {
            "2.1": "The_Amount_of_Chemical_Change",
            "2.2": "The_Rate_of_Chemical_Change",
            "2.3": "The_Extent_of_Chemical_Change"
        }

        pdf_filename = f"Pearson_R{section_code}_{section_titles[section_code]}.pdf"
        pdf_path = os.path.join(BASE_DIR, pdf_filename)

        pages = screenshots_to_pdf(screenshots_dir, pdf_path)
        total_pages[section_code] = pages

    # Summary
    print(f"\n{'═' * 70}")
    print("SUMMARY")
    print(f"{'═' * 70}")

    for section_code in sorted(SECTIONS.keys()):
        if section_code in total_crops:
            crops = total_crops[section_code]
            pages = total_pages.get(section_code, 0)
            print(f"\nR{section_code}:")
            print(f"  Cropped images: {crops}")
            print(f"  PDF pages: {pages}")

    print(f"\n{'═' * 70}")
    print("Processing complete!")
    print(f"{'═' * 70}\n")


if __name__ == "__main__":
    main()
