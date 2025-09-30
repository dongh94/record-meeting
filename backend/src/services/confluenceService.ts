import { Transcript } from "../types";

export interface ConfluenceConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
  spaceKey: string;
}

export interface ConfluencePageRequest {
  title: string;
  content: string;
  spaceKey?: string;
  parentId?: string;
}

export interface ConfluencePageResponse {
  id: string;
  title: string;
  webui: string;
  _links: {
    webui: string;
    base: string;
  };
}

export class ConfluenceService {
  private config: ConfluenceConfig;

  constructor() {
    this.config = {
      baseUrl: process.env.CONFLUENCE_BASE_URL || "",
      email: process.env.CONFLUENCE_EMAIL || "",
      apiToken: process.env.CONFLUENCE_API_TOKEN || "",
      spaceKey: process.env.CONFLUENCE_SPACE_KEY || "",
    };

    this.validateConfig();
  }

  private validateConfig(): void {
    const requiredFields = [
      "baseUrl",
      "email",
      "apiToken",
      "spaceKey",
    ] as const;

    for (const field of requiredFields) {
      if (!this.config[field]) {
        throw new Error(
          `Confluence ${field}가 설정되지 않았습니다. 환경변수를 확인해주세요.`
        );
      }
    }
  }

  private getAuthHeader(): string {
    const auth = Buffer.from(
      `${this.config.email}:${this.config.apiToken}`
    ).toString("base64");
    return `Basic ${auth}`;
  }

  /**
   * 회의록을 Confluence 페이지 형식으로 변환
   */
  private convertTranscriptToConfluenceFormat(transcript: Transcript): string {
    const content = `
<h1>${transcript.title}</h1>

<h2>📋 회의 요약</h2>
<p>${transcript.summary}</p>

<h2>👥 참석자</h2>
<ul>
${transcript.participants
  .map((participant) => `<li>${participant}</li>`)
  .join("")}
</ul>

<h2>🔑 핵심 포인트</h2>
<ul>
${transcript.keyPoints.map((point) => `<li>${point}</li>`).join("")}
</ul>

<h2>✅ 액션 아이템</h2>
<ul>
${transcript.actionItems.map((item) => `<li>${item}</li>`).join("")}
</ul>

<h2>📝 상세 내용</h2>
<div>
${transcript.content
  .split("\n")
  .map((line) => `<p>${line}</p>`)
  .join("")}
</div>

<hr/>
<p><em>생성일: ${new Date(transcript.createdAt).toLocaleString(
      "ko-KR"
    )}</em></p>
<p><em>회의록 ID: ${transcript.id}</em></p>
`;

    return content.trim();
  }

  /**
   * Confluence에 페이지 생성
   */
  async createPage(
    transcript: Transcript,
    options?: {
      spaceKey?: string;
      parentId?: string;
    }
  ): Promise<ConfluencePageResponse> {
    try {
      const spaceKey = options?.spaceKey || this.config.spaceKey;
      const content = this.convertTranscriptToConfluenceFormat(transcript);

      const pageData = {
        type: "page",
        title: transcript.title,
        space: {
          key: spaceKey,
        },
        body: {
          storage: {
            value: content,
            representation: "storage",
          },
        },
        ...(options?.parentId && {
          ancestors: [{ id: options.parentId }],
        }),
      };

      console.log("🔄 Confluence 페이지 생성 요청:", {
        title: transcript.title,
        spaceKey,
        parentId: options?.parentId,
      });

      const response = await fetch(
        `${this.config.baseUrl}/wiki/rest/api/content`,
        {
          method: "POST",
          headers: {
            Authorization: this.getAuthHeader(),
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(pageData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Confluence API 오류:", response.status, errorText);
        throw new Error(
          `Confluence 페이지 생성 실패: ${response.status} ${response.statusText}`
        );
      }

      const result = (await response.json()) as any;
      console.log("✅ Confluence 페이지 생성 성공:", result.id);

      return {
        id: result.id,
        title: result.title,
        webui: `${this.config.baseUrl}/wiki${result._links.webui}`,
        _links: result._links,
      };
    } catch (error) {
      console.error("❌ Confluence 페이지 생성 실패:", error);
      throw error;
    }
  }

  /**
   * REST API v2로 사용자가 접근 가능한 모든 스페이스 목록 조회
   */
  async getSpaces(): Promise<Array<{ key: string; name: string; id: string }>> {
    try {
      let allSpaces: Array<{ key: string; name: string; id: string }> = [];
      let cursor: string | undefined;
      let hasMore = true;

      console.log(`🔄 스페이스 조회 시작 (REST API v2)`);

      while (hasMore) {
        const params = new URLSearchParams({
          limit: "250",
          ...(cursor && { cursor }),
        });

        console.log(`🔍 v2 스페이스 조회: /wiki/api/v2/spaces?${params}`);

        const response = await fetch(
          `${this.config.baseUrl}/wiki/api/v2/spaces?${params}`,
          {
            method: "GET",
            headers: {
              Authorization: this.getAuthHeader(),
              Accept: "application/json",
            },
          }
        );

        if (!response.ok) {
          // v2 API 실패 시 v1 API로 폴백
          console.warn(
            `⚠️ v2 스페이스 API 실패 (${response.status}), v1 API로 폴백`
          );
          return this.getSpacesV1Fallback();
        }

        const result = (await response.json()) as any;
        const spaces = (result.results || []).map((space: any) => ({
          key: space.key,
          name: space.name,
          id: space.id,
        }));

        allSpaces = [...allSpaces, ...spaces];

        // 다음 페이지 확인
        const linkHeader = response.headers.get("Link");
        hasMore = !!linkHeader && linkHeader.includes('rel="next"');

        if (hasMore && result._links?.next) {
          const nextUrl = new URL(result._links.next, this.config.baseUrl);
          cursor = nextUrl.searchParams.get("cursor") || undefined;
        } else {
          hasMore = false;
        }

        console.log(
          `📊 이번 배치: ${spaces.length}개, 누적: ${allSpaces.length}개`
        );
      }

      console.log(`✅ v2 API로 총 ${allSpaces.length}개 스페이스 조회 완료`);

      // 이름순으로 정렬
      return allSpaces.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error("❌ v2 스페이스 조회 실패:", error);
      // v1 API로 폴백
      return this.getSpacesV1Fallback();
    }
  }

  /**
   * v1 API 폴백 - 스페이스 조회
   */
  private async getSpacesV1Fallback(): Promise<
    Array<{ key: string; name: string; id: string }>
  > {
    try {
      console.log(`🔄 v1 API 폴백으로 스페이스 조회`);

      let allSpaces: Array<{ key: string; name: string; id: string }> = [];
      let start = 0;
      const limit = 50;
      let hasMore = true;

      while (hasMore) {
        const response = await fetch(
          `${this.config.baseUrl}/wiki/rest/api/space?start=${start}&limit=${limit}`,
          {
            method: "GET",
            headers: {
              Authorization: this.getAuthHeader(),
              Accept: "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`v1 스페이스 목록 조회 실패: ${response.status}`);
        }

        const result = (await response.json()) as any;
        const spaces = result.results.map((space: any) => ({
          key: space.key,
          name: space.name,
          id: space.id,
        }));

        allSpaces = [...allSpaces, ...spaces];
        hasMore = result.results.length === limit && result._links?.next;
        start += limit;
      }

      console.log(`✅ v1 폴백으로 총 ${allSpaces.length}개 스페이스 조회 완료`);
      return allSpaces.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error("❌ v1 폴백 스페이스 조회도 실패:", error);
      throw error;
    }
  }

  /**
   * REST API v2를 사용하여 스페이스의 모든 콘텐츠 조회 (페이지 + 폴더)
   * 완전히 새로운 v2 기반 구현
   */
  async getSpacePages(spaceKey: string): Promise<
    Array<{
      id: string;
      title: string;
      type: string;
      parentId?: string;
      parentType?: string;
      level: number;
      hasChildren: boolean;
      position?: number;
    }>
  > {
    try {
      console.log(`🔄 ${spaceKey} 스페이스의 콘텐츠 조회 시작 (REST API v2)`);

      // 1단계: 스페이스 ID 조회
      const spaceId = await this.getSpaceId(spaceKey);
      console.log(`🏠 스페이스 ID: ${spaceId}`);

      // 2단계: v2 API로 모든 페이지 조회
      const allPages = await this.getAllPagesV2(spaceId);
      console.log(`📄 총 ${allPages.length}개 페이지 조회됨`);

      // 3단계: v2 API로 모든 폴더 조회 (시도)
      const allFolders = await this.getAllFoldersV2(spaceId);
      console.log(`📁 총 ${allFolders.length}개 폴더 조회됨`);

      // 4단계: 모든 콘텐츠 합치기
      const allContent = [...allPages, ...allFolders];

      // 5단계: 계층 구조 분석 및 필터링
      const processedContent = this.buildHierarchyV2(allContent);

      // 6단계: 폴더 역할을 하는 항목들만 필터링
      const folderItems = processedContent.filter(
        (item) =>
          item.type === "folder" || // 실제 폴더
          item.hasChildren || // 하위 페이지가 있는 페이지
          item.level <= 2 // 상위 레벨 페이지 (구조적 중요성)
      );

      console.log(
        `✅ 최종 결과: 전체 ${allContent.length}개 중 폴더 역할 ${folderItems.length}개 선별`
      );

      return folderItems.sort((a, b) => {
        // 정렬: 폴더 우선 → 레벨 순 → 위치 순 → 제목 순
        if (a.type === "folder" && b.type !== "folder") return -1;
        if (a.type !== "folder" && b.type === "folder") return 1;
        if (a.level !== b.level) return a.level - b.level;
        if (a.position !== undefined && b.position !== undefined) {
          return a.position - b.position;
        }
        return a.title.localeCompare(b.title);
      });
    } catch (error) {
      console.error("❌ 스페이스 콘텐츠 조회 실패:", error);
      throw error;
    }
  }

  /**
   * 스페이스 키로 스페이스 ID 조회 (v2 API는 ID 기반)
   */
  private async getSpaceId(spaceKey: string): Promise<string> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/wiki/rest/api/space/${spaceKey}`,
        {
          method: "GET",
          headers: {
            Authorization: this.getAuthHeader(),
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`스페이스 조회 실패: ${response.status}`);
      }

      const space = (await response.json()) as any;
      return space.id;
    } catch (error) {
      console.error("❌ 스페이스 ID 조회 실패:", error);
      throw error;
    }
  }

  /**
   * REST API v2로 스페이스의 모든 페이지 조회
   */
  private async getAllPagesV2(spaceId: string): Promise<any[]> {
    try {
      let allPages: any[] = [];
      let cursor: string | undefined;
      let hasMore = true;

      while (hasMore) {
        const params = new URLSearchParams({
          limit: "250",
          ...(cursor && { cursor }),
        });

        console.log(
          `🔍 v2 페이지 조회: /wiki/api/v2/spaces/${spaceId}/pages?${params}`
        );

        const response = await fetch(
          `${this.config.baseUrl}/wiki/api/v2/spaces/${spaceId}/pages?${params}`,
          {
            method: "GET",
            headers: {
              Authorization: this.getAuthHeader(),
              Accept: "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`페이지 조회 실패: ${response.status}`);
        }

        const result = (await response.json()) as any;
        const pages = result.results || [];

        allPages = [...allPages, ...pages];

        // 다음 페이지 확인
        const linkHeader = response.headers.get("Link");
        hasMore = !!linkHeader && linkHeader.includes('rel="next"');

        if (hasMore && result._links?.next) {
          // cursor 추출
          const nextUrl = new URL(result._links.next, this.config.baseUrl);
          cursor = nextUrl.searchParams.get("cursor") || undefined;
        } else {
          hasMore = false;
        }

        console.log(
          `📄 이번 배치: ${pages.length}개, 누적: ${allPages.length}개`
        );
      }

      return allPages;
    } catch (error) {
      console.error("❌ v2 페이지 조회 실패:", error);
      throw error;
    }
  }

  /**
   * REST API v2로 스페이스의 모든 폴더 조회 (다양한 방법 시도)
   */
  private async getAllFoldersV2(spaceId: string): Promise<any[]> {
    console.log(`🔍 v2 폴더 조회 시도 (스페이스 ${spaceId})`);

    const allFolders: any[] = [];

    // 방법 1: 전체 콘텐츠 조회에서 폴더 타입 찾기
    try {
      console.log(`📁 방법 1: 전체 콘텐츠에서 폴더 타입 찾기`);

      let cursor: string | undefined;
      let hasMore = true;
      let totalChecked = 0;

      while (hasMore && totalChecked < 1000) {
        // 최대 1000개까지만 확인
        const params = new URLSearchParams({
          limit: "100",
          ...(cursor && { cursor }),
        });

        // 모든 콘텐츠 타입 조회 (페이지, 폴더, 블로그포스트 등)
        const response = await fetch(
          `${this.config.baseUrl}/wiki/api/v2/pages?space-id=${spaceId}&${params}`,
          {
            method: "GET",
            headers: {
              Authorization: this.getAuthHeader(),
              Accept: "application/json",
            },
          }
        );

        if (!response.ok) {
          console.warn(`⚠️ 전체 콘텐츠 조회 실패: ${response.status}`);
          break;
        }

        const result = (await response.json()) as any;
        const items = result.results || [];

        totalChecked += items.length;
        console.log(
          `🔍 이번 배치에서 ${items.length}개 항목 확인, 누적: ${totalChecked}개`
        );

        // 폴더 타입만 필터링
        const folders = items.filter((item: any) => {
          console.log(`📋 항목 타입 확인: ${item.title} → type: ${item.type}`);
          return item.type === "folder";
        });

        if (folders.length > 0) {
          console.log(`📁 폴더 발견: ${folders.length}개`);
          folders.forEach((folder: any) => {
            console.log(`  - ${folder.title} (ID: ${folder.id})`);
          });
          allFolders.push(...folders);
        }

        // 다음 페이지 확인
        const linkHeader = response.headers.get("Link");
        hasMore = !!linkHeader && linkHeader.includes('rel="next"');

        if (hasMore && result._links?.next) {
          const nextUrl = new URL(result._links.next, this.config.baseUrl);
          cursor = nextUrl.searchParams.get("cursor") || undefined;
        } else {
          hasMore = false;
        }
      }

      console.log(
        `✅ 방법 1 완료: 총 ${totalChecked}개 항목 중 ${allFolders.length}개 폴더 발견`
      );
    } catch (error) {
      console.warn("⚠️ 방법 1 실패:", error);
    }

    // 방법 2: 직접 폴더 API 시도 (혹시 있을지 모르니)
    try {
      console.log(`📁 방법 2: 직접 폴더 API 시도`);

      const response = await fetch(
        `${this.config.baseUrl}/wiki/api/v2/folders?space-id=${spaceId}&limit=100`,
        {
          method: "GET",
          headers: {
            Authorization: this.getAuthHeader(),
            Accept: "application/json",
          },
        }
      );

      if (response.ok) {
        const result = (await response.json()) as any;
        const folders = result.results || [];
        console.log(`📁 방법 2 성공: ${folders.length}개 폴더 발견`);

        folders.forEach((folder: any) => {
          console.log(`  - ${folder.title} (ID: ${folder.id})`);
        });

        // 중복 제거하면서 추가
        const newFolders = folders.filter(
          (folder: any) =>
            !allFolders.some((existing) => existing.id === folder.id)
        );
        allFolders.push(...newFolders);
      } else {
        console.warn(`⚠️ 방법 2 실패: ${response.status} - 직접 폴더 API 없음`);
      }
    } catch (error) {
      console.warn("⚠️ 방법 2 실패:", error);
    }

    console.log(`🎯 최종 폴더 조회 결과: ${allFolders.length}개`);
    return allFolders;
  }

  /**
   * v2 API 응답 데이터로 계층 구조 구축
   */
  private buildHierarchyV2(allContent: any[]): Array<{
    id: string;
    title: string;
    type: string;
    parentId?: string;
    parentType?: string;
    level: number;
    hasChildren: boolean;
    position?: number;
  }> {
    console.log(`🏗️ 계층 구조 구축 시작: ${allContent.length}개 항목`);

    // 1단계: 부모-자식 관계 맵 구축
    const itemMap = new Map();
    const childrenMap = new Map<string, string[]>();

    allContent.forEach((item: any) => {
      const parentId = item.parentId;

      itemMap.set(item.id, {
        id: item.id,
        title: item.title,
        type: item.type || "page",
        parentId: parentId || undefined,
        parentType: item.parentType,
        level: 0, // 나중에 계산
        hasChildren: false, // 나중에 계산
        position: item.position,
      });

      // 자식 관계 구축
      if (parentId) {
        if (!childrenMap.has(parentId)) {
          childrenMap.set(parentId, []);
        }
        childrenMap.get(parentId)!.push(item.id);
      }
    });

    // 2단계: hasChildren 플래그 설정
    childrenMap.forEach((children, parentId) => {
      if (itemMap.has(parentId)) {
        const parent = itemMap.get(parentId);
        parent.hasChildren = children.length > 0;
      }
    });

    // 3단계: 레벨 계산 (재귀적)
    const calculateLevel = (itemId: string, visited = new Set()): number => {
      if (visited.has(itemId)) return 0; // 순환 참조 방지
      visited.add(itemId);

      const item = itemMap.get(itemId);
      if (!item || !item.parentId) return 0;

      return 1 + calculateLevel(item.parentId, visited);
    };

    // 모든 항목의 레벨 계산
    itemMap.forEach((item, itemId) => {
      item.level = calculateLevel(itemId);
    });

    const result = Array.from(itemMap.values());

    console.log(`✅ 계층 구조 구축 완료: ${result.length}개 항목`);
    console.log(
      `📊 레벨별 분포:`,
      [0, 1, 2, 3, 4]
        .map(
          (level) =>
            `L${level}:${result.filter((item) => item.level === level).length}`
        )
        .join(", ")
    );

    return result;
  }

  /**
   * 특정 스페이스의 페이지 목록 조회 (계층 구조 포함)
   */
  async getPages(
    spaceKey: string,
    parentId?: string
  ): Promise<
    Array<{
      id: string;
      title: string;
      type: string;
      parentId?: string;
      level: number;
      hasChildren: boolean;
    }>
  > {
    try {
      console.log(
        `🔄 페이지 조회 시작: ${spaceKey}`,
        parentId ? `(부모: ${parentId})` : ""
      );

      // 모든 페이지를 가져와서 계층 구조 구축
      const allPages = await this.getAllPagesInSpace(spaceKey);

      // 계층 구조 구축
      const hierarchicalPages = this.buildPageHierarchy(allPages);

      console.log(
        `✅ 페이지 조회 성공: ${hierarchicalPages.length}개 (계층 구조 포함)`
      );
      return hierarchicalPages;
    } catch (error) {
      console.error("❌ 페이지 조회 실패:", error);
      throw error;
    }
  }

  /**
   * 스페이스의 모든 페이지 가져오기 (페이지네이션 처리)
   */
  private async getAllPagesInSpace(spaceKey: string): Promise<any[]> {
    let allPages: any[] = [];
    let start = 0;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
      const params = new URLSearchParams({
        spaceKey,
        limit: limit.toString(),
        start: start.toString(),
        expand: "ancestors,children.page",
        type: "page",
      });

      const response = await fetch(
        `${this.config.baseUrl}/wiki/rest/api/content?${params}`,
        {
          method: "GET",
          headers: {
            Authorization: this.getAuthHeader(),
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ 페이지 조회 API 오류:", response.status, errorText);
        throw new Error(
          `페이지 조회 실패: ${response.status} ${response.statusText}`
        );
      }

      const result = (await response.json()) as any;
      const pages = result.results || [];

      allPages = [...allPages, ...pages];

      // 더 가져올 페이지가 있는지 확인
      hasMore = pages.length === limit;
      start += limit;

      console.log(
        `📄 페이지 배치 조회: ${pages.length}개 (총 ${allPages.length}개)`
      );
    }

    return allPages;
  }

  /**
   * 페이지 목록을 계층 구조로 변환
   */
  private buildPageHierarchy(pages: any[]): Array<{
    id: string;
    title: string;
    type: string;
    parentId?: string;
    level: number;
    hasChildren: boolean;
  }> {
    const pageMap = new Map<string, any>();
    const childrenMap = new Map<string, string[]>();

    // 페이지 맵 생성 및 부모-자식 관계 파악
    pages.forEach((page) => {
      pageMap.set(page.id, page);

      // 부모 페이지 ID 추출 (ancestors 배열의 마지막 항목)
      const ancestors = page.ancestors || [];
      const parentId =
        ancestors.length > 0 ? ancestors[ancestors.length - 1].id : undefined;

      if (parentId) {
        if (!childrenMap.has(parentId)) {
          childrenMap.set(parentId, []);
        }
        childrenMap.get(parentId)!.push(page.id);
      }
    });

    // 결과 생성
    const result = pages.map((page) => {
      const ancestors = page.ancestors || [];
      const parentId =
        ancestors.length > 0 ? ancestors[ancestors.length - 1].id : undefined;
      const level = ancestors.length;
      const hasChildren =
        childrenMap.has(page.id) && childrenMap.get(page.id)!.length > 0;

      return {
        id: page.id,
        title: page.title,
        type: page.type,
        parentId,
        level,
        hasChildren,
      };
    });

    // 제목순으로 정렬
    result.sort((a, b) => {
      // 같은 레벨에서는 제목순으로 정렬
      if (a.level === b.level) {
        return a.title.localeCompare(b.title);
      }
      // 다른 레벨이면 레벨순으로 정렬
      return a.level - b.level;
    });

    console.log(`🏗️ 계층 구조 구축 완료: ${result.length}개 페이지`);
    console.log(
      `📊 레벨별 분포:`,
      [0, 1, 2, 3, 4]
        .map(
          (level) =>
            `L${level}:${result.filter((p) => p.level === level).length}`
        )
        .join(", ")
    );

    return result;
  }

  /**
   * Confluence 연결 상태 확인
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/wiki/rest/api/space/${this.config.spaceKey}`,
        {
          method: "GET",
          headers: {
            Authorization: this.getAuthHeader(),
            Accept: "application/json",
          },
        }
      );

      return response.ok;
    } catch (error) {
      console.error("❌ Confluence 연결 테스트 실패:", error);
      return false;
    }
  }
}
