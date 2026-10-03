from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.search import SearchResultItem
from app.services.search_service import SearchService, MAX_SEARCH_LIMIT

router = APIRouter()


@router.get(
    "/search",
    response_model=List[SearchResultItem],
    summary="Semantic Document Search",
    tags=["Search"],
)
def semantic_search(
    q: Optional[str] = Query(None, description="Search query string"),
    limit: Optional[int] = Query(10, description="Maximum number of search results to return"),
    document_id: Optional[UUID] = Query(None, description="Optional document UUID to filter search results"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Executes semantic vector search over pre-computed document chunk embeddings for authenticated user.
    """
    if q is None or not q.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query string cannot be empty",
        )

    if limit is None or limit < 1 or limit > MAX_SEARCH_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Limit must be between 1 and {MAX_SEARCH_LIMIT}",
        )

    try:
        return SearchService.search(
            db=db,
            query=q,
            current_user=current_user,
            limit=limit,
            document_id=document_id,
        )
    except ValueError as ve:
        err_msg = str(ve)
        if "not found" in err_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=err_msg,
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=err_msg,
        )
