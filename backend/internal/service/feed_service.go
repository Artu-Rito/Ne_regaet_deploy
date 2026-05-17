package service

import (
	"gaming-lag-platform/internal/repository"
	"sort"
	"time"
)

type FeedItem struct {
	Kind      string    `json:"kind"` // "post" | "article"
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	Excerpt   string    `json:"excerpt"`
	AuthorID  string    `json:"author_id"`
	Nickname  string    `json:"nickname"`
	Game      string    `json:"game,omitempty"`
	PostType  string    `json:"post_type,omitempty"`
	Category  string    `json:"category,omitempty"`
	Tags      string    `json:"tags,omitempty"`
	IsPinned  bool      `json:"is_pinned"`
	CreatedAt time.Time `json:"created_at"`
}

type FeedService struct {
	postRepo    *repository.PostRepository
	articleRepo *repository.ArticleRepository
}

func NewFeedService(postRepo *repository.PostRepository, articleRepo *repository.ArticleRepository) *FeedService {
	return &FeedService{postRepo: postRepo, articleRepo: articleRepo}
}

// postTypeKinds are kind values that map to a post_type filter on the posts table.
var postTypeKinds = map[string]bool{"post": true, "guide": true, "news": true, "clip": true}

func (s *FeedService) GetFeed(page, limit int, kind, game, postType string) ([]FeedItem, int64, error) {
	var items []FeedItem

	fetchPosts := kind == "" || kind == "all" || postTypeKinds[kind]
	if fetchPosts {
		posts, _, err := s.postRepo.GetAll(1, 200)
		if err != nil {
			return nil, 0, err
		}
		// Determine post_type filter: explicit ?type= param takes precedence, then kind if it's a post type.
		typeFilter := postType
		if typeFilter == "" && postTypeKinds[kind] && kind != "all" {
			typeFilter = kind
		}
		for _, p := range posts {
			if game != "" && p.Game != game {
				continue
			}
			if typeFilter != "" && p.PostType != typeFilter {
				continue
			}
			excerpt := []rune(p.Content)
			if len(excerpt) > 160 {
				excerpt = excerpt[:160]
			}
			nickname := ""
			if p.Author.Nickname != "" {
				nickname = p.Author.Nickname
			}
			items = append(items, FeedItem{
				Kind:      "post",
				ID:        p.ID.String(),
				Title:     p.Title,
				Excerpt:   string(excerpt),
				AuthorID:  p.AuthorID.String(),
				Nickname:  nickname,
				Game:      p.Game,
				PostType:  p.PostType,
				IsPinned:  p.IsPinned,
				CreatedAt: p.CreatedAt,
			})
		}
	}

	if kind == "" || kind == "all" || kind == "article" {
		articles, err := s.articleRepo.GetAll("", "")
		if err != nil {
			return nil, 0, err
		}
		for _, a := range articles {
			if game != "" && a.Category != game {
				continue
			}
			excerpt := []rune(a.Content)
			if len(excerpt) > 160 {
				excerpt = excerpt[:160]
			}
			nickname := ""
			if a.Author.Nickname != "" {
				nickname = a.Author.Nickname
			}
			items = append(items, FeedItem{
				Kind:      "article",
				ID:        a.ID.String(),
				Title:     a.Title,
				Excerpt:   string(excerpt),
				AuthorID:  a.AuthorID.String(),
				Nickname:  nickname,
				Category:  a.Category,
				Tags:      a.Tags,
				CreatedAt: a.CreatedAt,
			})
		}
	}

	// Pinned posts first, then sort by created_at DESC
	sort.SliceStable(items, func(i, j int) bool {
		if items[i].IsPinned != items[j].IsPinned {
			return items[i].IsPinned
		}
		return items[i].CreatedAt.After(items[j].CreatedAt)
	})

	total := int64(len(items))

	// Paginate
	start := (page - 1) * limit
	if start >= len(items) {
		return []FeedItem{}, total, nil
	}
	end := start + limit
	if end > len(items) {
		end = len(items)
	}

	return items[start:end], total, nil
}
