"""
app/schemas/contact.py
──────────────────────────────────────────────────────────────────────────────
Pydantic v2 models for contacts — extended with new fields.
"""

from __future__ import annotations

from datetime import date
from typing import Annotated, Literal, Optional

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    field_validator,
    model_validator,
)

ContactPriority = Literal["High", "Medium", "Low"]
ContactStatus = Literal["Active", "Inactive", "Pending", "Archived"]
CompanyType = str
SourceType = Literal[
    "Business Card",
    "LinkedIn",
    "Referral",
    "Event",
    "Cold Outreach",
    "Website",
    "Excel Import",
    "CSV Import",
    "Manual Entry",
]


class ContactBase(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        str_strip_whitespace=True,
    )

    Name: Optional[str] = Field(None, max_length=200)
    Designation: Optional[str] = Field(None, max_length=200)
    Company: str = Field(..., min_length=1, max_length=200)
    Parent_Organization: Optional[str] = Field(None, max_length=200)
    Sector: Optional[str] = Field(None, max_length=100)
    Company_Type: Optional[str] = Field(None, max_length=100)
    Address: Optional[str] = Field(None, max_length=500)
    City: Optional[str] = Field(None, max_length=100)
    State: Optional[str] = Field(None, max_length=100)
    Country: Optional[str] = Field(None, max_length=100)
    Phone: Optional[str] = Field(None, max_length=30)
    Alternate_Phone: Optional[str] = Field(None, max_length=30)
    Email: Optional[str] = Field(None, max_length=200)
    Alternate_Email: Optional[str] = Field(None, max_length=200)
    Website: Optional[str] = Field(None, max_length=300)
    LinkedIn: Optional[str] = Field(None, max_length=300)
    Contact_Priority: Optional[ContactPriority] = "Medium"
    Status: Optional[ContactStatus] = "Active"
    Event_Source: Optional[str] = Field(None, max_length=200)
    Source_Type: Optional[SourceType] = "Manual Entry"
    Import_Source: Optional[str] = Field(
        None, max_length=200,
        description="Specific import origin, e.g. event name, spreadsheet filename"
    )
    Next_Followup_Date: Optional[date] = None
    AI_Tags: Optional[list[str]] = None
    AI_Summary: Optional[str] = None
    Notes: Optional[str] = None
    Raw_Extraction_JSON: Optional[str] = Field(
        None,
        description="Raw JSON from Gemini Vision extraction — stored for audit"
    )


class ContactCreate(ContactBase):
    Company: str = Field(..., min_length=1, max_length=200)


class ContactUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True, str_strip_whitespace=True)

    Name: Optional[str] = None
    Designation: Optional[str] = None
    Company: Optional[str] = None
    Parent_Organization: Optional[str] = None
    Sector: Optional[str] = None
    Company_Type: Optional[str] = None
    Address: Optional[str] = None
    City: Optional[str] = None
    State: Optional[str] = None
    Country: Optional[str] = None
    Phone: Optional[str] = None
    Alternate_Phone: Optional[str] = None
    Email: Optional[str] = None
    Alternate_Email: Optional[str] = None
    Website: Optional[str] = None
    LinkedIn: Optional[str] = None
    Contact_Priority: Optional[ContactPriority] = None
    Status: Optional[ContactStatus] = None
    Event_Source: Optional[str] = None
    Source_Type: Optional[SourceType] = None
    Import_Source: Optional[str] = None
    Next_Followup_Date: Optional[date] = None
    AI_Tags: Optional[list[str]] = None
    AI_Summary: Optional[str] = None
    Notes: Optional[str] = None


class ContactResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    Contact_ID: str
    Name: Optional[str] = None
    Designation: Optional[str] = None
    Company: Optional[str] = None
    Parent_Organization: Optional[str] = None
    Sector: Optional[str] = None
    Company_Type: Optional[str] = None
    Address: Optional[str] = None
    City: Optional[str] = None
    State: Optional[str] = None
    Country: Optional[str] = None
    Phone: Optional[str] = None
    Alternate_Phone: Optional[str] = None
    Email: Optional[str] = None
    Alternate_Email: Optional[str] = None
    Website: Optional[str] = None
    LinkedIn: Optional[str] = None
    Contact_Priority: Optional[str] = None
    Status: Optional[str] = "Active"
    Event_Source: Optional[str] = None
    Source_Type: Optional[str] = None
    Import_Source: Optional[str] = None
    Date_Added: Optional[str] = None
    Last_Updated: Optional[str] = None
    Next_Followup_Date: Optional[str] = None
    AI_Tags: Optional[list[str]] = None
    AI_Summary: Optional[str] = None
    Notes: Optional[str] = None
    Raw_Extraction_JSON: Optional[str] = None

    @field_validator("Date_Added", "Last_Updated", "Next_Followup_Date", mode="before")
    @classmethod
    def coerce_date(cls, v):
        if v is None:
            return None
        if isinstance(v, date):
            return v.isoformat()
        return str(v)

    @field_validator("AI_Tags", mode="before")
    @classmethod
    def coerce_tags(cls, v):
        if v is None:
            return []
        if isinstance(v, str):
            return [t.strip() for t in v.split(",") if t.strip()]
        return v


class PaginationMeta(BaseModel):
    page: int
    page_size: int
    total: int
    total_pages: int


class ContactListResponse(BaseModel):
    success: bool = True
    data: list[ContactResponse]
    meta: PaginationMeta


class ContactDetailResponse(BaseModel):
    success: bool = True
    data: ContactResponse


class ContactDeleteResponse(BaseModel):
    success: bool = True
    message: str


class ContactListParams(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    search: Optional[str] = None
    sector: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    source_type: Optional[str] = None
    company_type: Optional[str] = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)


class DuplicateCheckResponse(BaseModel):
    """Response for GET /contacts/check-duplicate"""
    success: bool = True
    is_duplicate: bool
    confidence: float = Field(ge=0.0, le=1.0)
    match_reason: Optional[str] = None
    existing_contact: Optional[ContactResponse] = None
