import React, { useState, useMemo } from "react";
import styled from "@emotion/styled";
import { ChevronRight, ChevronDown, FileText, Folder } from "lucide-react";
import { ConfluencePage } from "../hooks/useConfluence";

const TreeContainer = styled.div`
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  max-height: 300px;
  overflow-y: auto;
  background: white;
`;

const TreeItem = styled.div<{ level: number; isSelected?: boolean }>`
  display: flex;
  align-items: center;
  padding: 8px 12px;
  padding-left: ${(props) => 12 + props.level * 20}px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  background: ${(props) => (props.isSelected ? "#f0f4ff" : "white")};
  border-bottom: 1px solid #f5f5f5;

  &:hover {
    background: ${(props) => (props.isSelected ? "#e6edff" : "#f8f9fa")};
  }

  &:last-child {
    border-bottom: none;
  }
`;

const ExpandButton = styled.button`
  background: none;
  border: none;
  padding: 4px;
  margin-right: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.2s ease;

  &:hover {
    background: #f0f0f0;
  }

  &:disabled {
    opacity: 0.3;
    cursor: default;
  }
`;

const ItemContent = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
`;

const ItemTitle = styled.span`
  font-size: 0.9rem;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const EmptyState = styled.div`
  padding: 20px;
  text-align: center;
  color: #666;
  font-style: italic;
`;

const RootOption = styled.div<{ isSelected?: boolean }>`
  display: flex;
  align-items: center;
  padding: 12px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  background: ${(props) => (props.isSelected ? "#f0f4ff" : "white")};
  border-bottom: 2px solid #e1e5e9;
  font-weight: 500;

  &:hover {
    background: ${(props) => (props.isSelected ? "#e6edff" : "#f8f9fa")};
  }
`;

interface PageTreeProps {
  pages: ConfluencePage[];
  selectedPageId?: string;
  onPageSelect: (pageId?: string) => void;
  spaceName?: string;
}

const PageTree: React.FC<PageTreeProps> = ({
  pages,
  selectedPageId,
  onPageSelect,
  spaceName,
}) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // 페이지를 계층 구조로 정리
  const pageTree = useMemo(() => {
    const pageMap = new Map<string, ConfluencePage>();
    const childrenMap = new Map<string, ConfluencePage[]>();
    const rootPages: ConfluencePage[] = [];

    // 페이지 맵 생성
    pages.forEach((page) => {
      pageMap.set(page.id, page);
    });

    // 부모-자식 관계 정리
    pages.forEach((page) => {
      if (page.parentId) {
        if (!childrenMap.has(page.parentId)) {
          childrenMap.set(page.parentId, []);
        }
        childrenMap.get(page.parentId)!.push(page);
      } else {
        rootPages.push(page);
      }
    });

    // 자식 페이지들을 제목순으로 정렬
    childrenMap.forEach((children) => {
      children.sort((a, b) => a.title.localeCompare(b.title));
    });

    rootPages.sort((a, b) => a.title.localeCompare(b.title));

    return { pageMap, childrenMap, rootPages };
  }, [pages]);

  const toggleExpanded = (pageId: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(pageId)) {
      newExpanded.delete(pageId);
    } else {
      newExpanded.add(pageId);
    }
    setExpandedIds(newExpanded);
  };

  const renderPage = (page: ConfluencePage): React.ReactNode => {
    const isExpanded = expandedIds.has(page.id);
    const isSelected = selectedPageId === page.id;
    const children = pageTree.childrenMap.get(page.id) || [];

    return (
      <React.Fragment key={page.id}>
        <TreeItem
          level={page.level}
          isSelected={isSelected}
          onClick={() => onPageSelect(page.id)}
        >
          <ExpandButton
            onClick={(e) => {
              e.stopPropagation();
              if (page.hasChildren) {
                toggleExpanded(page.id);
              }
            }}
            disabled={!page.hasChildren}
          >
            {page.hasChildren ? (
              isExpanded ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )
            ) : (
              <div style={{ width: 16, height: 16 }} />
            )}
          </ExpandButton>

          <ItemContent>
            {page.type === "folder" ? (
              <Folder size={16} color="#4A90E2" />
            ) : page.hasChildren ? (
              <Folder size={16} color="#667eea" />
            ) : (
              <FileText size={16} color="#666" />
            )}
            <ItemTitle title={page.title}>
              {page.title}
              {page.type === "folder" && (
                <span
                  style={{
                    fontSize: "0.8em",
                    color: "#4A90E2",
                    marginLeft: "4px",
                  }}
                >
                  📁
                </span>
              )}
            </ItemTitle>
          </ItemContent>
        </TreeItem>

        {isExpanded && children.map((child) => renderPage(child))}
      </React.Fragment>
    );
  };

  if (pages.length === 0) {
    return (
      <TreeContainer>
        <EmptyState>페이지가 없습니다.</EmptyState>
      </TreeContainer>
    );
  }

  return (
    <TreeContainer>
      {/* 루트 옵션 (스페이스 루트에 생성) */}
      <RootOption
        isSelected={!selectedPageId}
        onClick={() => onPageSelect(undefined)}
      >
        <Folder size={16} color="#667eea" style={{ marginRight: 8 }} />
        {spaceName ? `${spaceName} 루트` : "스페이스 루트"}
      </RootOption>

      {/* 페이지 트리 */}
      {pageTree.rootPages.map((page) => renderPage(page))}
    </TreeContainer>
  );
};

export default PageTree;
