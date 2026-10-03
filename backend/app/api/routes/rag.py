from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.rag import RAGRequest, RAGResponse
from app.services.rag_service import RAGService, RAGServiceError

router = APIRouter()


@router.post(
    "/ask",
    response_model=RAGResponse,
    status_code=status.HTTP_200_OK,
    summary="RAG Question Answering",
    tags=["RAG"],
)
def ask_question(
    body: RAGRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieves top relevant document chunks for authenticated user and generates a grounded answer using Gemini LLM.
    """
    if not body.question or not body.question.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question string cannot be empty",
        )

    try:
        return RAGService.answer_question(
            db=db,
            question=body.question,
            current_user=current_user,
            limit=body.limit,
            document_id=body.document_id,
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
    except RAGServiceError as rse:
        error_msg = str(rse)
        if "not configured" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=error_msg,
            )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=error_msg,
        )
