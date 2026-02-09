from core.prompts.core_prompt import CORE_SYSTEM_PROMPT

SUNA_CONFIG = {
    "name": "Kortix",
    "description": "Data analysis agent — generates professional Chinese HTML reports from uploaded data files.",
    "model": "kortix/basic",
    "max_steps": 35,  # allow more fix-and-retry cycles for report generation stability
    "llm_max_tokens": 81920,  # large create_file (build_report.py) — avoid stream stopping mid-output
    "system_prompt": CORE_SYSTEM_PROMPT,
    "configured_mcps": [],
    "custom_mcps": [],
    "agentpress_tools": {
        # Data analysis essentials
        "sb_shell_tool": True,          # execute_command for Python scripts
        "sb_files_tool": True,          # create_file / edit_file for reports
        "sb_expose_tool": True,         # HTML preview URL
        "sb_upload_file_tool": True,    # file uploads

        # Disabled — not needed for data analysis
        "sb_git_sync": False,
        "web_search_tool": False,
        "image_search_tool": False,
        "sb_vision_tool": False,
        "sb_image_edit_tool": False,
        "sb_design_tool": False,
        "sb_presentation_tool": False,
        "sb_kb_tool": False,
        "people_search_tool": False,
        "company_search_tool": False,
        "browser_tool": False,
        "agent_config_tool": False,
        "agent_creation_tool": False,
        "mcp_search_tool": False,
        "credential_profile_tool": False,
        "trigger_tool": False,
    },
    "is_default": True
}

