#!/usr/bin/env python3
"""
MedAssist AI — Word Document (.docx) Final Report Generator
Converts FINAL_PROJECT_REPORT.md into a publication-ready DOCX document calibrated precisely for 15-17 pages.
"""

import re
from pathlib import Path
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

PRIMARY_COLOR = RGBColor(14, 116, 144)      # Teal / Cyan Accent (#0e7490)
SECONDARY_COLOR = RGBColor(30, 41, 59)     # Dark Slate (#1e293b)
TEXT_COLOR = RGBColor(51, 65, 85)          # Slate Text (#334155)
BG_HEADER_COLOR = "0E7490"                 # Teal hex for tables
BG_ROW_ALT = "F8FAFC"                      # Light gray alternate row hex


def set_cell_background(cell, color_hex):
    """Set background color for a table cell."""
    shading = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shading)


def set_cell_margins(cell, top=80, bottom=80, left=120, right=120):
    """Set internal padding for table cells."""
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
        node = OxmlElement(m)
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)


def add_callout_box(doc, text, alert_type="IMPORTANT"):
    """Adds a stylish callout quote box."""
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    cell = table.cell(0, 0)
    cell.width = Inches(6.5)
    set_cell_background(cell, "FEF2F2" if alert_type == "WARNING" else "F0FDF4" if alert_type == "TIP" else "F1F5F9")
    set_cell_margins(cell, top=100, bottom=100, left=140, right=140)
    
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'<w:left w:val="single" w:sz="24" w:space="0" w:color="0E7490"/>'
        f'<w:top w:val="none"/>'
        f'<w:right w:val="none"/>'
        f'<w:bottom w:val="none"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(3)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.line_spacing = 1.2
    run_title = p.add_run(f"[{alert_type}] ")
    run_title.bold = True
    run_title.font.color.rgb = PRIMARY_COLOR
    run_title.font.size = Pt(10)
    
    run_text = p.add_run(text)
    run_text.font.size = Pt(9.5)
    run_text.font.color.rgb = SECONDARY_COLOR


def generate_docx():
    repo_root = Path(__file__).parent.parent
    md_path = repo_root / "FINAL_PROJECT_REPORT.md"
    output_path = repo_root / "MedAssist_AI_Final_Project_Report.docx"
    fallback_path = repo_root / "MedAssist_AI_Final_Project_Report_Updated.docx"
    
    if not md_path.exists():
        print(f"Error: {md_path} does not exist.")
        return
    
    with open(md_path, "r", encoding="utf-8") as f:
        md_text = f.read()
    
    doc = Document()
    
    # Page setup - Margins (1.0 inch all around)
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)
        section.header.is_linked_to_previous = False
        header_p = section.header.paragraphs[0]
        header_p.text = "MedAssist AI — Final Project Technical Documentation & Evaluation Report"
        header_p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        header_p.style.font.size = Pt(8.5)
        header_p.style.font.color.rgb = RGBColor(148, 163, 184)
    
    # Base styling
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Segoe UI'
    normal_style.font.size = Pt(11)
    normal_style.font.color.rgb = TEXT_COLOR
    normal_style.paragraph_format.line_spacing = 1.2
    normal_style.paragraph_format.space_before = Pt(1)
    normal_style.paragraph_format.space_after = Pt(5)
    
    lines = md_text.split("\n")
    i = 0
    in_code_block = False
    code_buffer = []
    
    while i < len(lines):
        line = lines[i]
        
        # Check code block
        if line.strip().startswith("```"):
            if in_code_block:
                # Flush code block
                table = doc.add_table(rows=1, cols=1)
                table.alignment = WD_TABLE_ALIGNMENT.CENTER
                cell = table.cell(0, 0)
                cell.width = Inches(6.5)
                set_cell_background(cell, "0F172A")
                set_cell_margins(cell, top=90, bottom=90, left=130, right=130)
                cp = cell.paragraphs[0]
                cp.paragraph_format.space_before = Pt(2)
                cp.paragraph_format.space_after = Pt(2)
                cp.paragraph_format.line_spacing = 1.05
                crun = cp.add_run("\n".join(code_buffer))
                crun.font.name = 'Consolas'
                crun.font.size = Pt(8)
                crun.font.color.rgb = RGBColor(226, 232, 240)
                code_buffer = []
                in_code_block = False
            else:
                in_code_block = True
                code_buffer = []
            i += 1
            continue
            
        if in_code_block:
            code_buffer.append(line)
            i += 1
            continue
            
        # Title (Document Title)
        if line.startswith("# MedAssist AI"):
            title_p = doc.add_paragraph()
            title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            title_p.paragraph_format.space_before = Pt(14)
            title_p.paragraph_format.space_after = Pt(6)
            run = title_p.add_run(line.replace("#", "").strip())
            run.font.size = Pt(21)
            run.bold = True
            run.font.color.rgb = PRIMARY_COLOR
            i += 1
            continue
            
        # Major Headings (# 1. Heading)
        if line.startswith("# "):
            h_p = doc.add_paragraph()
            h_p.paragraph_format.space_before = Pt(16)
            h_p.paragraph_format.space_after = Pt(5)
            run = h_p.add_run(line.replace("#", "").strip())
            run.font.size = Pt(15)
            run.bold = True
            run.font.color.rgb = PRIMARY_COLOR
            i += 1
            continue
            
        # Subheadings (## Heading or ### Heading)
        if line.startswith("## ") or line.startswith("### "):
            h_p = doc.add_paragraph()
            h_p.paragraph_format.space_before = Pt(11)
            h_p.paragraph_format.space_after = Pt(3.5)
            run = h_p.add_run(re.sub(r"^#+\s*", "", line).strip())
            run.font.size = Pt(12.5) if line.startswith("## ") else Pt(11.5)
            run.bold = True
            run.font.color.rgb = SECONDARY_COLOR
            i += 1
            continue
            
        # Table Parsing
        if line.strip().startswith("|") and "|" in line:
            table_lines = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                table_lines.append(lines[i].strip())
                i += 1
            
            if len(table_lines) >= 2:
                raw_header = [c.strip() for c in table_lines[0].split("|")[1:-1]]
                data_rows = []
                for row_line in table_lines[2:]:
                    data_rows.append([c.strip() for c in row_line.split("|")[1:-1]])
                
                num_cols = len(raw_header)
                if num_cols > 0:
                    tbl = doc.add_table(rows=len(data_rows) + 1, cols=num_cols)
                    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
                    tbl.autofit = True
                    
                    # Style Header
                    hdr_row = tbl.rows[0]
                    for col_idx, col_name in enumerate(raw_header):
                        cell = hdr_row.cells[col_idx]
                        set_cell_background(cell, BG_HEADER_COLOR)
                        set_cell_margins(cell, top=60, bottom=60, left=90, right=90)
                        p = cell.paragraphs[0]
                        p.paragraph_format.space_before = Pt(2)
                        p.paragraph_format.space_after = Pt(2)
                        p.paragraph_format.line_spacing = 1.12
                        run = p.add_run(col_name)
                        run.bold = True
                        run.font.color.rgb = RGBColor(255, 255, 255)
                        run.font.size = Pt(9.5)
                    
                    # Style Data Rows
                    for row_idx, row_data in enumerate(data_rows):
                        row = tbl.rows[row_idx + 1]
                        bg_color = BG_ROW_ALT if row_idx % 2 == 1 else "FFFFFF"
                        for col_idx in range(num_cols):
                            cell = row.cells[col_idx]
                            set_cell_background(cell, bg_color)
                            set_cell_margins(cell, top=50, bottom=50, left=80, right=80)
                            p = cell.paragraphs[0]
                            p.paragraph_format.space_before = Pt(1.5)
                            p.paragraph_format.space_after = Pt(1.5)
                            p.paragraph_format.line_spacing = 1.12
                            val = row_data[col_idx] if col_idx < len(row_data) else ""
                            val_clean = val.replace("**", "").replace("`", "")
                            run = p.add_run(val_clean)
                            run.font.size = Pt(9)
                            if "**" in val or col_idx == 0:
                                run.bold = True
            continue
            
        # Blockquote / Alerts
        if line.startswith("> "):
            alert_text = line.replace("> ", "").strip()
            add_callout_box(doc, alert_text.replace("**MANDATORY MEDICAL DISCLAIMER**:", "").replace("**Note**:", "").strip(), alert_type="IMPORTANT")
            i += 1
            continue
            
        # Bullet list
        if line.strip().startswith("- ") or line.strip().startswith("* "):
            p = doc.add_paragraph(style='List Bullet')
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(3)
            p.paragraph_format.line_spacing = 1.18
            content = line.strip()[2:]
            clean_content = content.replace("**", "")
            run = p.add_run(clean_content)
            run.font.size = Pt(10.5)
            i += 1
            continue
            
        # Numbered list
        if re.match(r"^\d+\.\s+", line.strip()):
            p = doc.add_paragraph(style='List Number')
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(3)
            p.paragraph_format.line_spacing = 1.18
            content = re.sub(r"^\d+\.\s+", "", line.strip())
            run = p.add_run(content.replace("**", ""))
            run.font.size = Pt(10.5)
            i += 1
            continue
            
        # Regular paragraph
        if line.strip():
            if line.strip() == "---":
                i += 1
                continue
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(1.5)
            p.paragraph_format.space_after = Pt(4.5)
            p.paragraph_format.line_spacing = 1.18
            run = p.add_run(line.strip().replace("**", ""))
            run.font.size = Pt(10.5)
        
        i += 1
        
    try:
        doc.save(output_path)
        print(f"Successfully generated final Word document at: {output_path}")
    except Exception as e:
        print(f"Primary save error ({e}).")
    
    try:
        doc.save(fallback_path)
        print(f"Successfully saved updated copy to: {fallback_path}")
    except Exception as e:
        print(f"Fallback save error ({e}).")


if __name__ == "__main__":
    generate_docx()
