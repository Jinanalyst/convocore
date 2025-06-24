import { NextRequest, NextResponse } from 'next/server';
import { documentService } from '@/lib/document-service';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const shareId = url.searchParams.get('shareId');

    if (shareId) {
      // Get shared document
      const sharedDoc = documentService.getSharedDocument(shareId);
      
      if (!sharedDoc) {
        return NextResponse.json(
          { error: 'Shared document not found or expired' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        document: sharedDoc.document,
        metadata: {
          viewCount: sharedDoc.viewCount,
          allowEdit: sharedDoc.allowEdit,
          expiresAt: sharedDoc.expiresAt
        }
      });
    }

    // Get all documents (for user library)
    const documents = documentService.getAllDocuments();
    
    return NextResponse.json({
      success: true,
      documents
    });

  } catch (error) {
    console.error('Error handling document request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'create':
        const document = documentService.createDocument(
          data.title,
          data.content,
          data.type,
          data.options
        );
        
        return NextResponse.json({
          success: true,
          document
        });

      case 'share':
        const shareId = documentService.shareDocument(data.documentId, data.options);
        
        if (!shareId) {
          return NextResponse.json(
            { error: 'Document not found' },
            { status: 404 }
          );
        }

        const shareUrl = documentService.getShareUrl(shareId);
        
        return NextResponse.json({
          success: true,
          shareId,
          shareUrl
        });

      case 'update':
        const updatedDoc = documentService.updateDocument(data.documentId, data.updates);
        
        if (!updatedDoc) {
          return NextResponse.json(
            { error: 'Document not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          document: updatedDoc
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error handling document operation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const documentId = url.searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID required' },
        { status: 400 }
      );
    }

    const success = documentService.deleteDocument(documentId);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 