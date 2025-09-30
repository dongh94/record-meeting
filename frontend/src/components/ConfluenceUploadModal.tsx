import React, { useState, useEffect, useMemo } from "react";
import styled from "@emotion/styled";
import {
  X,
  Upload,
  Folder,
  FileText,
  Loader,
  Search,
  RefreshCw,
} from "lucide-react";
import { Transcript } from "../hooks/useTranscription";
import {
  useConfluence,
  ConfluenceSpace,
  ConfluencePage,
} from "../hooks/useConfluence";
import PageTree from "./PageTree";

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Modal = styled.div`
  background: white;
  border-radius: 16px;
  padding: 32px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  color: #666;
  transition: all 0.2s ease;

  &:hover {
    background: #f5f5f5;
    color: #333;
  }
`;

const Section = styled.div`
  margin-bottom: 24px;
`;

const Label = styled.label`
  display: block;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
`;

const Select = styled.select`
  width: 100%;
  padding: 12px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  cursor: pointer;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: #667eea;
  }

  &:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
  }
`;

const Option = styled.option`
  padding: 8px;
`;

const SearchableSelectContainer = styled.div`
  position: relative;
  width: 100%;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 12px 40px 12px 12px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: #667eea;
  }

  &:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
  }
`;

const SearchIcon = styled(Search)`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
  pointer-events: none;
`;

const DropdownList = styled.div<{ isOpen: boolean }>`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 2px solid #e1e5e9;
  border-top: none;
  border-radius: 0 0 8px 8px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  display: ${(props) => (props.isOpen ? "block" : "none")};
`;

const DropdownItem = styled.div<{ isSelected?: boolean }>`
  padding: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.2s ease;
  background: ${(props) => (props.isSelected ? "#f0f4ff" : "white")};

  &:hover {
    background: #f5f5f5;
  }

  &:last-child {
    border-radius: 0 0 6px 6px;
  }
`;

const NoResults = styled.div`
  padding: 12px;
  color: #666;
  text-align: center;
  font-style: italic;
`;

const RefreshButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  color: #667eea;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.9rem;

  &:hover {
    background: #f0f4ff;
    color: #5a6fd8;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const LoadingIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  color: #666;
  font-size: 0.9rem;
`;

const SpinnerIcon = styled(Loader)`
  animation: spin 1s linear infinite;

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const InfoText = styled.p`
  color: #666;
  font-size: 0.9rem;
  margin: 8px 0 0 0;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 32px;
`;

const Button = styled.button<{ variant?: "primary" | "secondary" }>`
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;

  ${(props) =>
    props.variant === "primary"
      ? `
    background: #667eea;
    color: white;
    
    &:hover:not(:disabled) {
      background: #5a6fd8;
    }
  `
      : `
    background: #f5f5f5;
    color: #666;
    
    &:hover:not(:disabled) {
      background: #e8e8e8;
    }
  `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  background: #fee;
  color: #c33;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 0.9rem;
`;

interface ConfluenceUploadModalProps {
  isOpen: boolean;
  transcript: Transcript;
  onClose: () => void;
  onSuccess: (pageUrl: string) => void;
}

const ConfluenceUploadModal: React.FC<ConfluenceUploadModalProps> = ({
  isOpen,
  transcript,
  onClose,
  onSuccess,
}) => {
  const confluence = useConfluence();
  const [selectedSpaceKey, setSelectedSpaceKey] = useState<string>("");
  const [selectedParentId, setSelectedParentId] = useState<string>("");
  const [spaceSearchTerm, setSpaceSearchTerm] = useState<string>("");
  const [isSpaceDropdownOpen, setIsSpaceDropdownOpen] =
    useState<boolean>(false);

  // 모달이 열릴 때 스페이스 목록 로드 (부수 효과 - API 호출)
  useEffect(() => {
    if (isOpen && confluence.spaces.length === 0) {
      confluence.loadSpaces();
    }
  }, [isOpen]);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest("[data-searchable-select]")) {
        setIsSpaceDropdownOpen(false);
      }
    };

    if (isSpaceDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isSpaceDropdownOpen]);

  // 검색어로 필터링된 스페이스 목록
  const filteredSpaces = useMemo(() => {
    if (!spaceSearchTerm) return confluence.spaces;

    const searchLower = spaceSearchTerm.toLowerCase();
    return confluence.spaces.filter(
      (space) =>
        space.name.toLowerCase().includes(searchLower) ||
        space.key.toLowerCase().includes(searchLower)
    );
  }, [confluence.spaces, spaceSearchTerm]);

  // 선택된 스페이스 정보
  const selectedSpace = confluence.spaces.find(
    (space) => space.key === selectedSpaceKey
  );

  const handleSpaceSelect = (space: ConfluenceSpace) => {
    setSelectedSpaceKey(space.key);
    setSpaceSearchTerm(space.name);
    setIsSpaceDropdownOpen(false);

    // 스페이스 변경 시 페이지 목록 로드 및 부모 페이지 초기화
    confluence.loadPages(space.key);
    setSelectedParentId("");
  };

  const handleSearchInputChange = (value: string) => {
    setSpaceSearchTerm(value);
    setIsSpaceDropdownOpen(true);

    // 검색어가 정확히 일치하는 스페이스가 있으면 자동 선택
    const exactMatch = confluence.spaces.find(
      (space) =>
        space.name.toLowerCase() === value.toLowerCase() ||
        space.key.toLowerCase() === value.toLowerCase()
    );

    if (exactMatch && exactMatch.key !== selectedSpaceKey) {
      // 새로운 스페이스가 선택된 경우에만 API 호출
      setSelectedSpaceKey(exactMatch.key);
      confluence.loadPages(exactMatch.key);
      setSelectedParentId("");
    } else if (
      selectedSpaceKey &&
      selectedSpace &&
      !selectedSpace.name.toLowerCase().includes(value.toLowerCase())
    ) {
      // 현재 선택된 스페이스와 검색어가 맞지 않으면 선택 해제
      setSelectedSpaceKey("");
      setSelectedParentId("");
    }
  };

  const handleUpload = async () => {
    try {
      const result = await confluence.uploadToConfluence(transcript, {
        spaceKey: selectedSpaceKey,
        parentId: selectedParentId || undefined,
      });

      if (result) {
        onSuccess(result.pageUrl);
        onClose();
      }
    } catch (error) {
      console.error("업로드 실패:", error);
    }
  };

  const canUpload = selectedSpaceKey && !confluence.isUploading;

  if (!isOpen) return null;

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title>Confluence에 업로드</Title>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </Header>

        {confluence.error && <ErrorMessage>{confluence.error}</ErrorMessage>}

        <Section>
          <SectionHeader>
            <Label>스페이스 선택</Label>
            <RefreshButton
              onClick={() => confluence.loadSpaces(true)}
              disabled={confluence.isLoadingSpaces}
              title="스페이스 목록 새로고침"
            >
              <RefreshCw size={14} />
              새로고침
            </RefreshButton>
          </SectionHeader>
          {confluence.isLoadingSpaces ? (
            <LoadingIndicator>
              <SpinnerIcon size={16} />
              스페이스 목록을 불러오는 중...
            </LoadingIndicator>
          ) : (
            <>
              <SearchableSelectContainer data-searchable-select>
                <SearchInput
                  type="text"
                  placeholder="스페이스 이름 또는 키를 검색하세요..."
                  value={spaceSearchTerm}
                  onChange={(e) => handleSearchInputChange(e.target.value)}
                  onFocus={() => setIsSpaceDropdownOpen(true)}
                  disabled={confluence.spaces.length === 0}
                />
                <SearchIcon size={16} />

                <DropdownList
                  isOpen={isSpaceDropdownOpen && filteredSpaces.length > 0}
                >
                  {filteredSpaces.length > 0 ? (
                    filteredSpaces.map((space) => (
                      <DropdownItem
                        key={space.key}
                        isSelected={space.key === selectedSpaceKey}
                        onClick={() => handleSpaceSelect(space)}
                      >
                        <Folder size={16} />
                        <div>
                          <strong>{space.name}</strong>
                          <div style={{ fontSize: "0.85em", color: "#666" }}>
                            {space.key}
                          </div>
                        </div>
                      </DropdownItem>
                    ))
                  ) : spaceSearchTerm ? (
                    <NoResults>검색 결과가 없습니다.</NoResults>
                  ) : null}
                </DropdownList>
              </SearchableSelectContainer>

              {confluence.spaces.length === 0 && (
                <InfoText>사용 가능한 스페이스가 없습니다.</InfoText>
              )}

              {selectedSpace && (
                <InfoText>
                  선택된 스페이스: <strong>{selectedSpace.name}</strong> (
                  {selectedSpace.key})
                </InfoText>
              )}
            </>
          )}
        </Section>

        <Section>
          <SectionHeader>
            <Label>부모 페이지 선택 (선택사항)</Label>
            {selectedSpaceKey && (
              <RefreshButton
                onClick={() => confluence.loadPages(selectedSpaceKey, true)}
                disabled={confluence.isLoadingPages}
                title="페이지 목록 새로고침"
              >
                <RefreshCw size={14} />
                새로고침
              </RefreshButton>
            )}
          </SectionHeader>
          {confluence.isLoadingPages ? (
            <LoadingIndicator>
              <SpinnerIcon size={16} />
              페이지 목록을 불러오는 중...
            </LoadingIndicator>
          ) : selectedSpaceKey ? (
            <>
              <PageTree
                pages={confluence.pages}
                selectedPageId={selectedParentId}
                onPageSelect={(pageId) => setSelectedParentId(pageId || "")}
                spaceName={selectedSpace?.name}
              />
              <InfoText>
                부모 페이지를 선택하면 해당 페이지 하위에 회의록이 생성됩니다.
                선택하지 않으면 스페이스 루트에 생성됩니다.
              </InfoText>
            </>
          ) : (
            <InfoText>먼저 스페이스를 선택해주세요.</InfoText>
          )}
        </Section>

        <ButtonGroup>
          <Button variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button
            variant="primary"
            onClick={handleUpload}
            disabled={!canUpload}
          >
            {confluence.isUploading ? (
              <>
                <SpinnerIcon size={16} />
                업로드 중...
              </>
            ) : (
              <>
                <Upload size={16} />
                업로드
              </>
            )}
          </Button>
        </ButtonGroup>
      </Modal>
    </Overlay>
  );
};

export default ConfluenceUploadModal;
