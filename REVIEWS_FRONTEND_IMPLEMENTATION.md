# Reviews Module - Frontend Implementation Guide

## 📋 Overview

The Reviews module is a comprehensive system that allows users to submit detailed reviews for restaurants with category-based ratings, photo uploads, owner responses, and social features like likes/dislikes. This guide provides step-by-step instructions for frontend developers to implement all review functionality.

---

## 🏗️ Architecture Overview

### Core Components
1. **Review Categories** - Dynamic rating categories (Food, Service, Ambience, etc.)
2. **Reviews** - Main review entity with overall rating, comment, and category ratings
3. **Review Photos** - Image uploads for reviews
4. **Owner Responses** - Restaurant owner responses to reviews
5. **Review Flags** - User reporting system for inappropriate reviews
6. **Review Likes/Dislikes** - Social interaction system
7. **Analytics** - Review statistics and averages

### Data Flow
```
User → Review Form → Category Ratings + Photos → Submit → Review List → Analytics
Restaurant Owner → View Reviews → Respond → Update Status
Users → View Reviews → Like/Dislike → Flag (if needed)
```

---

## 🔌 API Endpoints Reference

### Review Categories
- `GET /api/review-categories/` - List all active categories
- `POST /api/review-categories/` - Create category (Admin only)
- `PUT /api/review-categories/{id}/` - Update category (Admin only)
- `DELETE /api/review-categories/{id}/` - Delete category (Admin only)

### Reviews
- `POST /api/restaurants/{restaurant_id}/reviews/add/` - Submit review
- `GET /api/restaurants/{restaurant_id}/reviews/` - List restaurant reviews
- `PUT /api/reviews/{id}/edit/` - Edit review
- `DELETE /api/reviews/{id}/delete/` - Delete review

### Review Actions
- `POST /api/reviews/{id}/flag/` - Flag inappropriate review
- `POST /api/reviews/{id}/respond/` - Owner response
- `POST /api/reviews/{id}/like/` - Like/dislike review
- `PUT /api/reviews/{id}/status/` - Update review status (Admin)

### Analytics
- `GET /api/restaurants/{restaurant_id}/reviews/analytics/` - Review statistics

---

## 🎯 Implementation Steps

### Step 1: Review Categories Management

#### 1.1 Fetch Review Categories
```javascript
// Fetch categories before rendering review form
const fetchReviewCategories = async () => {
  try {
    const response = await fetch('/api/review-categories/');
    const categories = await response.json();
    return categories.filter(cat => cat.is_active);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};
```

#### 1.2 Dynamic Category Rating Component
```jsx
const CategoryRatingInput = ({ category, rating, onChange }) => {
  return (
    <div className="category-rating">
      <label>{category.name}</label>
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            className={`star ${star <= rating ? 'filled' : ''}`}
            onClick={() => onChange(category.id, star)}
          >
            ★
          </button>
        ))}
      </div>
      <span className="rating-value">{rating}/5</span>
    </div>
  );
};
```

### Step 2: Review Submission Form

#### 2.1 Review Form Component
```jsx
const ReviewForm = ({ restaurantId, onSubmit }) => {
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    overall_rating: 0,
    comment: '',
    category_ratings: [],
    photos: []
  });

  useEffect(() => {
    fetchReviewCategories().then(setCategories);
  }, []);

  const handleCategoryRating = (categoryId, rating) => {
    setFormData(prev => ({
      ...prev,
      category_ratings: [
        ...prev.category_ratings.filter(cr => cr.category_id !== categoryId),
        { category_id: categoryId, rating }
      ]
    }));
  };

  const handlePhotoUpload = (files) => {
    setFormData(prev => ({
      ...prev,
      photos: Array.from(files)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all categories have ratings
    if (formData.category_ratings.length !== categories.length) {
      alert('Please rate all categories');
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('overall_rating', formData.overall_rating);
    formDataToSend.append('comment', formData.comment);
    
    // Add category ratings
    formData.category_ratings.forEach(cr => {
      formDataToSend.append('category_ratings', JSON.stringify(cr));
    });
    
    // Add photos
    formData.photos.forEach(photo => {
      formDataToSend.append('photos', photo);
    });

    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/reviews/add/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: formDataToSend
      });
      
      if (response.ok) {
        onSubmit();
      }
    } catch (error) {
      console.error('Error submitting review:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="review-form">
      <h3>Write a Review</h3>
      
      {/* Overall Rating */}
      <div className="overall-rating">
        <label>Overall Rating</label>
        <StarRating
          rating={formData.overall_rating}
          onChange={(rating) => setFormData(prev => ({ ...prev, overall_rating: rating }))}
        />
      </div>

      {/* Category Ratings */}
      <div className="category-ratings">
        <h4>Rate by Category</h4>
        {categories.map(category => (
          <CategoryRatingInput
            key={category.id}
            category={category}
            rating={formData.category_ratings.find(cr => cr.category_id === category.id)?.rating || 0}
            onChange={handleCategoryRating}
          />
        ))}
      </div>

      {/* Comment */}
      <div className="comment-section">
        <label>Your Review</label>
        <textarea
          value={formData.comment}
          onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
          placeholder="Share your experience..."
          required
        />
      </div>

      {/* Photo Upload */}
      <div className="photo-upload">
        <label>Add Photos (Optional)</label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handlePhotoUpload(e.target.files)}
        />
      </div>

      <button type="submit" className="submit-btn">Submit Review</button>
    </form>
  );
};
```

### Step 3: Review List Display

#### 3.1 Review List Component
```jsx
const ReviewList = ({ restaurantId }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, [restaurantId]);

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/reviews/`);
      const data = await response.json();
      setReviews(data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (reviewId, isLike) => {
    try {
      await fetch(`/api/reviews/${reviewId}/like/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ is_like: isLike })
      });
      fetchReviews(); // Refresh to get updated counts
    } catch (error) {
      console.error('Error liking review:', error);
    }
  };

  const handleFlag = async (reviewId, reason, details) => {
    try {
      await fetch(`/api/reviews/${reviewId}/flag/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ reason, details })
      });
      alert('Review flagged successfully');
    } catch (error) {
      console.error('Error flagging review:', error);
    }
  };

  if (loading) return <div>Loading reviews...</div>;

  return (
    <div className="review-list">
      {reviews.map(review => (
        <ReviewCard
          key={review.id}
          review={review}
          onLike={handleLike}
          onFlag={handleFlag}
        />
      ))}
    </div>
  );
};
```

#### 3.2 Individual Review Card
```jsx
const ReviewCard = ({ review, onLike, onFlag }) => {
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flagData, setFlagData] = useState({ reason: '', details: '' });

  const isOwner = review.restaurant.owner === getCurrentUserId();
  const isAuthor = review.user.id === getCurrentUserId();

  return (
    <div className="review-card">
      {/* User Info */}
      <div className="review-header">
        <img src={review.user.profile_picture} alt={review.user.username} />
        <div>
          <h4>{review.user.username}</h4>
          <span>{new Date(review.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Overall Rating */}
      <div className="overall-rating">
        <StarRating rating={review.overall_rating} readonly />
        <span>{review.overall_rating}/5</span>
      </div>

      {/* Category Ratings */}
      <div className="category-ratings">
        {review.category_ratings.map(cr => (
          <div key={cr.id} className="category-rating">
            <span>{cr.category.name}:</span>
            <StarRating rating={cr.rating} readonly size="small" />
          </div>
        ))}
      </div>

      {/* Comment */}
      <p className="review-comment">{review.comment}</p>

      {/* Photos */}
      {review.photos.length > 0 && (
        <div className="review-photos">
          {review.photos.map(photo => (
            <img key={photo.id} src={photo.image} alt="Review photo" />
          ))}
        </div>
      )}

      {/* Owner Response */}
      {review.owner_response && (
        <div className="owner-response">
          <h5>Owner Response:</h5>
          <p>{review.owner_response}</p>
        </div>
      )}

      {/* Actions */}
      <div className="review-actions">
        <div className="like-dislike">
          <button onClick={() => onLike(review.id, true)}>
            👍 {review.likes_count}
          </button>
          <button onClick={() => onLike(review.id, false)}>
            👎 {review.dislikes_count}
          </button>
        </div>

        {!isAuthor && (
          <button onClick={() => setShowFlagModal(true)}>
            Report
          </button>
        )}

        {isAuthor && (
          <div className="author-actions">
            <button onClick={() => handleEdit(review.id)}>Edit</button>
            <button onClick={() => handleDelete(review.id)}>Delete</button>
          </div>
        )}

        {isOwner && !review.owner_response && (
          <button onClick={() => handleRespond(review.id)}>
            Respond
          </button>
        )}
      </div>

      {/* Flag Modal */}
      {showFlagModal && (
        <FlagModal
          onClose={() => setShowFlagModal(false)}
          onSubmit={(reason, details) => {
            onFlag(review.id, reason, details);
            setShowFlagModal(false);
          }}
        />
      )}
    </div>
  );
};
```

### Step 4: Owner Response System

#### 4.1 Owner Response Modal
```jsx
const OwnerResponseModal = ({ reviewId, onClose, onSubmit }) => {
  const [response, setResponse] = useState('');

  const handleSubmit = async () => {
    try {
      await fetch(`/api/reviews/${reviewId}/respond/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ owner_response: response })
      });
      onSubmit();
      onClose();
    } catch (error) {
      console.error('Error submitting response:', error);
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Respond to Review</h3>
        <textarea
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          placeholder="Write your response..."
          required
        />
        <div className="modal-actions">
          <button onClick={onClose}>Cancel</button>
          <button onClick={handleSubmit}>Submit Response</button>
        </div>
      </div>
    </div>
  );
};
```

### Step 5: Review Analytics

#### 5.1 Analytics Component
```jsx
const ReviewAnalytics = ({ restaurantId }) => {
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, [restaurantId]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/reviews/analytics/`);
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  if (!analytics) return <div>Loading analytics...</div>;

  return (
    <div className="review-analytics">
      <h3>Review Statistics</h3>
      
      <div className="overall-stats">
        <div className="stat">
          <h4>Overall Rating</h4>
          <div className="rating-display">
            <StarRating rating={Math.round(analytics.overall_average)} readonly />
            <span>{analytics.overall_average.toFixed(1)}/5</span>
          </div>
        </div>
        
        <div className="stat">
          <h4>Total Reviews</h4>
          <span>{analytics.total_reviews}</span>
        </div>
      </div>

      <div className="category-stats">
        <h4>Category Averages</h4>
        {analytics.category_averages.map(cat => (
          <div key={cat.category.id} className="category-stat">
            <span>{cat.category.name}:</span>
            <StarRating rating={Math.round(cat.average)} readonly size="small" />
            <span>{cat.average.toFixed(1)}/5</span>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Step 6: Utility Components

#### 6.1 Star Rating Component
```jsx
const StarRating = ({ rating, onChange, readonly = false, size = 'medium' }) => {
  const stars = [1, 2, 3, 4, 5];
  
  return (
    <div className={`star-rating ${size}`}>
      {stars.map(star => (
        <button
          key={star}
          type="button"
          className={`star ${star <= rating ? 'filled' : ''}`}
          onClick={() => !readonly && onChange(star)}
          disabled={readonly}
        >
          ★
        </button>
      ))}
    </div>
  );
};
```

#### 6.2 Flag Modal Component
```jsx
const FlagModal = ({ onClose, onSubmit }) => {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');

  const handleSubmit = () => {
    if (!reason.trim()) {
      alert('Please select a reason');
      return;
    }
    onSubmit(reason, details);
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Flag Review</h3>
        
        <div className="flag-reason">
          <label>Reason:</label>
          <select value={reason} onChange={(e) => setReason(e.target.value)}>
            <option value="">Select a reason</option>
            <option value="Spam">Spam</option>
            <option value="Inappropriate">Inappropriate Content</option>
            <option value="Fake">Fake Review</option>
            <option value="Offensive">Offensive Language</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="flag-details">
          <label>Additional Details (Optional):</label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Please provide more details..."
          />
        </div>

        <div className="modal-actions">
          <button onClick={onClose}>Cancel</button>
          <button onClick={handleSubmit}>Submit Flag</button>
        </div>
      </div>
    </div>
  );
};
```

---

## 🎨 CSS Styling Guidelines

### Core Classes
```css
/* Review Form */
.review-form {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.category-rating {
  display: flex;
  align-items: center;
  margin: 10px 0;
  gap: 10px;
}

.star-rating {
  display: flex;
  gap: 2px;
}

.star {
  background: none;
  border: none;
  font-size: 20px;
  color: #ddd;
  cursor: pointer;
}

.star.filled {
  color: #ffd700;
}

/* Review Cards */
.review-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  margin: 10px 0;
}

.review-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.review-photos {
  display: flex;
  gap: 10px;
  margin: 10px 0;
  overflow-x: auto;
}

.review-photos img {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 4px;
}

.owner-response {
  background: #f8f9fa;
  padding: 10px;
  border-left: 3px solid #007bff;
  margin: 10px 0;
}

/* Analytics */
.review-analytics {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.category-stat {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 5px 0;
}

/* Modals */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
}
```

---

## 🔐 Authentication & Authorization

### Required Headers
```javascript
const getAuthHeaders = () => ({
  'Authorization': `Bearer ${getAuthToken()}`,
  'Content-Type': 'application/json'
});

const getMultipartHeaders = () => ({
  'Authorization': `Bearer ${getAuthToken()}`
  // Don't set Content-Type for multipart/form-data
});
```

### Permission Checks
```javascript
const checkPermissions = {
  canEditReview: (review) => review.user.id === getCurrentUserId(),
  canDeleteReview: (review) => review.user.id === getCurrentUserId(),
  canRespondToReview: (review) => review.restaurant.owner === getCurrentUserId(),
  canFlagReview: (review) => review.user.id !== getCurrentUserId(),
  isAdmin: () => getCurrentUserRole() === 'admin'
};
```

---

## 🚀 Implementation Checklist

### Phase 1: Core Review System
- [ ] Fetch and display review categories
- [ ] Implement review submission form
- [ ] Create star rating component
- [ ] Add photo upload functionality
- [ ] Display review list with category ratings

### Phase 2: User Interactions
- [ ] Implement like/dislike functionality
- [ ] Add review flagging system
- [ ] Create edit/delete review options
- [ ] Add owner response system

### Phase 3: Analytics & Admin
- [ ] Display review analytics
- [ ] Implement admin review management
- [ ] Add review status updates
- [ ] Create category management (admin)

### Phase 4: Polish & UX
- [ ] Add loading states
- [ ] Implement error handling
- [ ] Add success/error notifications
- [ ] Optimize for mobile devices
- [ ] Add accessibility features

---

## 🐛 Common Issues & Solutions

### 1. Category Ratings Validation
```javascript
// Ensure all active categories have ratings
const validateCategoryRatings = (ratings, categories) => {
  const activeCategories = categories.filter(cat => cat.is_active);
  return activeCategories.every(cat => 
    ratings.some(rating => rating.category_id === cat.id)
  );
};
```

### 2. Photo Upload Limits
```javascript
const validatePhotos = (files) => {
  const maxFiles = 5;
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (files.length > maxFiles) {
    throw new Error(`Maximum ${maxFiles} photos allowed`);
  }
  
  for (let file of files) {
    if (file.size > maxSize) {
      throw new Error(`File ${file.name} is too large`);
    }
  }
};
```

### 3. Real-time Updates
```javascript
// Refresh reviews after actions
const refreshReviews = () => {
  fetchReviews();
  if (onReviewUpdate) onReviewUpdate();
};
```

---

## 📱 Mobile Considerations

### Responsive Design
- Use flexbox for layout
- Implement touch-friendly star ratings
- Optimize photo upload for mobile
- Ensure modal dialogs work on small screens

### Performance
- Implement lazy loading for review lists
- Optimize image sizes for mobile
- Use pagination for large review lists
- Cache review categories

---

## 🧪 Testing Guidelines

### Unit Tests
- Test star rating component
- Validate form submissions
- Test permission checks
- Verify API integrations

### Integration Tests
- Test complete review flow
- Verify owner response system
- Test flagging functionality
- Validate analytics calculations

### User Acceptance Tests
- Test on different devices
- Verify accessibility compliance
- Test with various user roles
- Validate error handling

---

This implementation guide provides a complete roadmap for building a robust review system that matches your backend architecture. Follow the steps sequentially and ensure proper error handling and user experience throughout the development process. 