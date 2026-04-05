#!/usr/bin/env python3
"""
Crop question-relevant images from Pearson IB Chemistry HL Structure 3 screenshots.
Uses Pillow to identify and extract tables, graphs, diagrams, and figures.
"""

from PIL import Image
import os

# Define base paths
base_path = "/sessions/elegant-blissful-davinci/mnt/IB Chemistry/3-Resources/Pearson IB Chemistry HL"
s31_screenshots = f"{base_path}/Structure_3.1/Screenshots"
s31_output = f"{base_path}/Structure_3.1/Question_Images"
s32_screenshots = f"{base_path}/Structure_3.2/Screenshots"
s32_output = f"{base_path}/Structure_3.2/Question_Images"

# Create output directories if they don't exist
os.makedirs(s31_output, exist_ok=True)
os.makedirs(s32_output, exist_ok=True)

def crop_and_save(input_path, output_path, filename, crop_box, description=""):
    """Crop an image and save it with a descriptive name."""
    try:
        img = Image.open(input_path)
        cropped = img.crop(crop_box)
        output_file = os.path.join(output_path, filename)
        cropped.save(output_file, quality=95)
        print(f"✓ Cropped: {filename}")
        return True
    except Exception as e:
        print(f"✗ Error cropping {filename}: {e}")
        return False

# ===== STRUCTURE 3.1 CROPS =====
print("\n=== Cropping Structure 3.1 Images ===\n")

# S3.1_02: Periodic Table (color-coded)
# The periodic table is on the right side of the page
crop_and_save(
    f"{s31_screenshots}/S3.1_02_Periodic_Table_Groups_Metals.png",
    s31_output,
    "S3.1_02_periodic_table.png",
    (650, 50, 1300, 350),
    "Periodic table with color-coded groups"
)

# S3.1_05: Atomic/Ionic Radius Data Tables
# Multiple tables on the left and center
crop_and_save(
    f"{s31_screenshots}/S3.1_05_Atomic_Ionic_Radius_IE.png",
    s31_output,
    "S3.1_05_atomic_radius_table.png",
    (150, 130, 550, 280),
    "Atomic and ionic radius data table"
)

crop_and_save(
    f"{s31_screenshots}/S3.1_05_Atomic_Ionic_Radius_IE.png",
    s31_output,
    "S3.1_05_ionization_energy_table.png",
    (150, 180, 550, 300),
    "Ionization energy table"
)

# S3.1_06: Ionization Energy Graphs and Electron Affinity Bar Chart
# Left side has line graphs
crop_and_save(
    f"{s31_screenshots}/S3.1_06_IE_Graphs_Electron_Affinity.png",
    s31_output,
    "S3.1_06_IE_graph_across_period.png",
    (150, 80, 480, 280),
    "First ionization energy graph across a period"
)

# Right side has electron affinity bar chart
crop_and_save(
    f"{s31_screenshots}/S3.1_06_IE_Graphs_Electron_Affinity.png",
    s31_output,
    "S3.1_06_electron_affinity_chart.png",
    (800, 80, 1250, 280),
    "Electron affinity bar chart"
)

# S3.1_07: Electronegativity Trend Graphs
crop_and_save(
    f"{s31_screenshots}/S3.1_07_Electronegativity_Exercises.png",
    s31_output,
    "S3.1_07_electronegativity_trends.png",
    (150, 80, 650, 280),
    "Electronegativity trend graphs"
)

# S3.1_09: Halogen Displacement Photos
# Left side has solution colors photo
crop_and_save(
    f"{s31_screenshots}/S3.1_09_Halogens_Displacement.png",
    s31_output,
    "S3.1_09_halogen_solutions.png",
    (150, 120, 500, 280),
    "Halogen solutions showing color variation"
)

# Right side has displacement reaction test tubes
crop_and_save(
    f"{s31_screenshots}/S3.1_09_Halogens_Displacement.png",
    s31_output,
    "S3.1_09_displacement_reactions.png",
    (800, 150, 1100, 320),
    "Halogen displacement reaction tube colors"
)

# S3.1_11: Period 3 Oxides Acid-Base Character Table and Photo
# Table on left
crop_and_save(
    f"{s31_screenshots}/S3.1_11_Oxides_Acid_Base_Character.png",
    s31_output,
    "S3.1_11_period3_oxides_table.png",
    (150, 100, 550, 220),
    "Period 3 oxides properties table"
)

# Photo of acid-base indicators
crop_and_save(
    f"{s31_screenshots}/S3.1_11_Oxides_Acid_Base_Character.png",
    s31_output,
    "S3.1_11_oxide_acidbase_photo.png",
    (150, 220, 550, 320),
    "Period 3 oxides with acid-base indicator colors"
)

# S3.1_12: Acid Rain/Ocean Acidification Diagrams
crop_and_save(
    f"{s31_screenshots}/S3.1_12_Acid_Rain_Ocean_Acidification.png",
    s31_output,
    "S3.1_12_acid_rain_diagram.png",
    (150, 100, 550, 320),
    "Acid rain formation and effects diagram"
)

# S3.1_18: Transition Metal Melting Point Graph
crop_and_save(
    f"{s31_screenshots}/S3.1_18_S3.1.8_Physical_Properties_HL.png",
    s31_output,
    "S3.1_18_melting_point_graph.png",
    (150, 80, 550, 200),
    "Transition metal melting point trend"
)

# Transition metals data table
crop_and_save(
    f"{s31_screenshots}/S3.1_18_S3.1.8_Physical_Properties_HL.png",
    s31_output,
    "S3.1_18_transition_metal_table.png",
    (150, 200, 550, 320),
    "Transition metal properties table"
)

# Magnetic property photo
crop_and_save(
    f"{s31_screenshots}/S3.1_18_S3.1.8_Physical_Properties_HL.png",
    s31_output,
    "S3.1_18_magnetic_property_photo.png",
    (750, 180, 1150, 320),
    "Magnetic properties of transition metals"
)

# S3.1_22: Colour Wheel, d-Orbital Splitting Diagram
# Color wheel
crop_and_save(
    f"{s31_screenshots}/S3.1_22_S3.1.10_Colour_d_Splitting_HL.png",
    s31_output,
    "S3.1_22_colour_wheel.png",
    (350, 80, 650, 280),
    "Color wheel for complementary colors"
)

# d-orbital splitting diagrams
crop_and_save(
    f"{s31_screenshots}/S3.1_22_S3.1.10_Colour_d_Splitting_HL.png",
    s31_output,
    "S3.1_22_d_orbital_splitting.png",
    (750, 100, 1150, 320),
    "d-orbital splitting in octahedral and tetrahedral geometry"
)

# S3.1_23: Beer-Lambert Colorimetry Setup and Spectra
# Colorimeter/spectrophotometer setup
crop_and_save(
    f"{s31_screenshots}/S3.1_23_S3.1.10_Colorimetry_Beer_Lambert_HL.png",
    s31_output,
    "S3.1_23_colorimeter_setup.png",
    (150, 80, 500, 250),
    "Colorimeter/spectrophotometer experimental setup"
)

# Absorption curve
crop_and_save(
    f"{s31_screenshots}/S3.1_23_S3.1.10_Colorimetry_Beer_Lambert_HL.png",
    s31_output,
    "S3.1_23_absorption_curve.png",
    (150, 240, 500, 320),
    "Beer-Lambert law absorption curve"
)

# Right side colorimetry solutions photo
crop_and_save(
    f"{s31_screenshots}/S3.1_23_S3.1.10_Colorimetry_Beer_Lambert_HL.png",
    s31_output,
    "S3.1_23_colored_solutions.png",
    (750, 80, 1150, 240),
    "Series of colored solutions for colorimetry"
)

# Data table for Beer-Lambert
crop_and_save(
    f"{s31_screenshots}/S3.1_23_S3.1.10_Colorimetry_Beer_Lambert_HL.png",
    s31_output,
    "S3.1_23_beerlambert_data.png",
    (750, 240, 1150, 320),
    "Beer-Lambert law data table"
)

# ===== STRUCTURE 3.2 CROPS =====
print("\n=== Cropping Structure 3.2 Images ===\n")

# S3.2_04: Functional Groups Table
crop_and_save(
    f"{s32_screenshots}/S3.2_04_S3.2.2_Functional_Groups_Classes.png",
    s32_output,
    "S3.2_04_functional_groups_table.png",
    (600, 40, 1300, 350),
    "Comprehensive functional groups table"
)

# S3.2_06: Homologous Series and Boiling Point Data
# Left side alkane series
crop_and_save(
    f"{s32_screenshots}/S3.2_06_S3.2.3_S3.2.4_Homologous_Series.png",
    s32_output,
    "S3.2_06_homologous_series_table.png",
    (150, 100, 550, 280),
    "Homologous series properties table"
)

# Right side boiling point data table
crop_and_save(
    f"{s32_screenshots}/S3.2_06_S3.2.3_S3.2.4_Homologous_Series.png",
    s32_output,
    "S3.2_06_boiling_point_table.png",
    (750, 150, 1150, 300),
    "Boiling point trends in homologous series"
)

# S3.2_14: Stereoisomer Classification Diagram
crop_and_save(
    f"{s32_screenshots}/S3.2_14_S3.2.7_Stereoisomers_HL.png",
    s32_output,
    "S3.2_14_stereoisomer_classification.png",
    (750, 70, 1150, 300),
    "Stereoisomer classification flowchart"
)

# Stereoisomer models
crop_and_save(
    f"{s32_screenshots}/S3.2_14_S3.2.7_Stereoisomers_HL.png",
    s32_output,
    "S3.2_14_stereoisomer_models.png",
    (750, 280, 1150, 330),
    "Molecular models of cis-trans isomers"
)

# S3.2_16: Chirality Hand/Molecule Diagram
crop_and_save(
    f"{s32_screenshots}/S3.2_16_S3.2.7_Optical_Isomers_Chirality_HL.png",
    s32_output,
    "S3.2_16_chiral_center_diagram.png",
    (150, 80, 550, 240),
    "Chiral center and enantiomers diagram"
)

# Hands and molecule models
crop_and_save(
    f"{s32_screenshots}/S3.2_16_S3.2.7_Optical_Isomers_Chirality_HL.png",
    s32_output,
    "S3.2_16_chirality_models.png",
    (750, 150, 1150, 330),
    "Hand and molecular models demonstrating chirality"
)

# S3.2_20: Mass Spectrometer Diagram and Mass Spectrum
crop_and_save(
    f"{s32_screenshots}/S3.2_20_S3.2.8_Mass_Spectrometry.png",
    s32_output,
    "S3.2_20_mass_spectrometer.png",
    (150, 80, 550, 270),
    "Mass spectrometer apparatus diagram"
)

# Mass spectrum example
crop_and_save(
    f"{s32_screenshots}/S3.2_20_S3.2.8_Mass_Spectrometry.png",
    s32_output,
    "S3.2_20_mass_spectrum.png",
    (750, 180, 1150, 320),
    "Example mass spectrum"
)

# S3.2_22: IR Spectrum Examples and Wavenumber Table
# Left side IR spectrum diagrams
crop_and_save(
    f"{s32_screenshots}/S3.2_22_S3.2.9_IR_Wavenumber_HL.png",
    s32_output,
    "S3.2_22_IR_spectrum_diagrams.png",
    (150, 80, 550, 320),
    "IR spectrum examples with peak assignments"
)

# Right side wavenumber reference table
crop_and_save(
    f"{s32_screenshots}/S3.2_22_S3.2.9_IR_Wavenumber_HL.png",
    s32_output,
    "S3.2_22_IR_wavenumber_table.png",
    (750, 140, 1150, 310),
    "IR wavenumber reference table"
)

# S3.2_24: IR Spectra for Exercises
# Right side greenhouse gases IR spectrum
crop_and_save(
    f"{s32_screenshots}/S3.2_24_S3.2.9_IR_Spectra_Examples_HL.png",
    s32_output,
    "S3.2_24_ir_spectra_examples.png",
    (750, 80, 1150, 240),
    "IR spectra examples of organic compounds"
)

# Data table
crop_and_save(
    f"{s32_screenshots}/S3.2_24_S3.2.9_IR_Spectra_Examples_HL.png",
    s32_output,
    "S3.2_24_ir_identification_table.png",
    (750, 240, 1150, 310),
    "IR peak identification table"
)

# S3.2_27: Chemical Shift Table for NMR
# MRI brain image and magnetic field explanation
crop_and_save(
    f"{s32_screenshots}/S3.2_27_S3.2.10_Chemical_Shifts_Environments_HL.png",
    s32_output,
    "S3.2_27_mri_image.png",
    (750, 80, 1150, 240),
    "MRI brain image showing NMR application"
)

# Left side text with environment explanations
crop_and_save(
    f"{s32_screenshots}/S3.2_27_S3.2.10_Chemical_Shifts_Environments_HL.png",
    s32_output,
    "S3.2_27_magnetic_resonance_explanation.png",
    (150, 80, 600, 320),
    "Magnetic resonance and NMR explanation"
)

# S3.2_28: Chemical Shifts Table (continued)
crop_and_save(
    f"{s32_screenshots}/S3.2_28_S3.2.10_Chemical_Shifts_Table_HL.png",
    s32_output,
    "S3.2_28_nmr_spectra_examples.png",
    (150, 100, 550, 260),
    "NMR spectra examples with integration"
)

# Chemical shift reference table
crop_and_save(
    f"{s32_screenshots}/S3.2_28_S3.2.10_Chemical_Shifts_Table_HL.png",
    s32_output,
    "S3.2_28_chemical_shift_table.png",
    (750, 140, 1150, 280),
    "Chemical shift reference table for NMR"
)

# S3.2_29: H-NMR Spectra Examples
# Left side integration examples table
crop_and_save(
    f"{s32_screenshots}/S3.2_29_S3.2.11_H_NMR_Spectra_HL.png",
    s32_output,
    "S3.2_29_hnmr_integration_table.png",
    (150, 100, 550, 260),
    "H-NMR integration and peak identification"
)

# Right side splitting pattern examples
crop_and_save(
    f"{s32_screenshots}/S3.2_29_S3.2.11_H_NMR_Spectra_HL.png",
    s32_output,
    "S3.2_29_hnmr_spectra_examples.png",
    (750, 100, 1150, 260),
    "H-NMR spectra examples with multiplicities"
)

print("\n=== Cropping Complete ===\n")
print(f"Structure 3.1 images saved to: {s31_output}")
print(f"Structure 3.2 images saved to: {s32_output}")
