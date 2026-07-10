/* ============================================================
   Page: NewsMediaForm.jsx
   Description: Add/Edit news article form with image upload, content editor
   ============================================================ */

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { NEWS_CATEGORIES } from '../../data/mockData';
import { apiRequest } from '../../config/apiHelper';

export default function NewsMediaForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const isEditing = !!id;

  const [categoriesList, setCategoriesList] = useState(() => {
    const defaultCats = [...NEWS_CATEGORIES];
    try {
      const stored = localStorage.getItem('kfpl_news_media');
      if (stored) {
        const articles = JSON.parse(stored);
        articles.forEach(a => {
          if (a.category && !defaultCats.includes(a.category)) {
            defaultCats.push(a.category);
          }
        });
      }
    } catch (e) {
      console.warn(e);
    }
    return defaultCats;
  });

  const [form, setForm] = useState({
    title: '',
    category: NEWS_CATEGORIES[0],
    author: '',
    date: new Date().toISOString().split('T')[0],
    status: 'Draft',
    excerpt: '',
    content: '',
    imageUrl: '',
    quote: '',
    quoteAuthor: '',
    advisory: '',
  });

  const [imagePreview, setImagePreview] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    if (isEditing) {
      const fetchArticle = async () => {
        try {
          const data = await apiRequest(`/api/super-admin/articles/${id}`);
          const article = data.article || data.data || data;
          if (article) {
            let formattedDate = '';
            if (article.publishDate || article.date) {
              try {
                formattedDate = new Date(article.publishDate || article.date).toISOString().split('T')[0];
              } catch (e) {
                formattedDate = article.date || '';
              }
            }

            setForm({
              title: article.title || '',
              category: article.category || NEWS_CATEGORIES[0],
              author: article.author || '',
              date: formattedDate,
              status: article.status || 'Draft',
              excerpt: article.excerpt || '',
              content: article.content || '',
              imageUrl: article.imageUrl || article.featuredImage || '',
              quote: article.specialQuote || article.quote || '',
              quoteAuthor: article.quoteAuthorRole || article.quoteAuthor || '',
              advisory: article.advisoryNotice || article.advisory || '',
            });

            if (article.category) {
              setCategoriesList(prev => {
                if (!prev.includes(article.category)) {
                  return [...prev, article.category];
                }
                return prev;
              });
            }
            if (article.imageUrl || article.featuredImage) {
              setImagePreview(article.imageUrl || article.featuredImage);
            }
          }
        } catch (err) {
          console.error('Failed to load article details', err);
          alert('Failed to load article details from the database.');
        }
      };
      fetchArticle();
    }
  }, [id, isEditing]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleAddNewCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    setCategoriesList(prev => {
      if (!prev.includes(trimmed)) {
        return [...prev, trimmed];
      }
      return prev;
    });
    handleChange('category', trimmed);
    setNewCategoryName('');
    setShowNewCategoryInput(false);
  };

  const handleImageUpload = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPG, PNG, GIF, WebP)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be under 5MB');
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleImageUpload(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeImage = () => {
    setImagePreview('');
    setSelectedFile(null);
    handleChange('imageUrl', '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('category', form.category);
      formData.append('author', form.author);
      formData.append('status', form.status);
      formData.append('excerpt', form.excerpt || '');
      formData.append('content', form.content);

      if (form.date) {
        formData.append('publishDate', new Date(form.date).toISOString());
      }
      formData.append('specialQuote', form.quote || '');
      formData.append('quoteAuthorRole', form.quoteAuthor || '');
      formData.append('advisoryNotice', form.advisory || '');

      if (selectedFile) {
        formData.append('featuredImage', selectedFile);
      } else if (form.imageUrl) {
        formData.append('imageUrl', form.imageUrl);
      }

      if (isEditing) {
        await apiRequest(`/api/super-admin/articles/${id}`, {
          method: 'PATCH',
          body: formData,
        });
      } else {
        await apiRequest('/api/super-admin/articles', {
          method: 'POST',
          body: formData,
        });
      }

      navigate('/news-media');
    } catch (err) {
      console.error('Failed to save article:', err);
      alert(`Failed to save article: ${err.message || 'Server error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const isValid = form.title && form.category && form.author && form.content;

  return (
    <div className="kfpl-page">
      <div className="kfpl-page-header">
        <div className="kfpl-page-header-left">
          <h1 className="kfpl-page-title">{isEditing ? 'Edit Article' : 'Add New Article'}</h1>
          <p className="kfpl-page-subtitle">
            {isEditing ? 'Update the article details below' : 'Create a new article for investors to read'}
          </p>
        </div>
      </div>

      <form className="kfpl-nm-form-layout" onSubmit={handleSubmit}>
        {/* Main Content Column */}
        <div className="kfpl-nm-form-main">
          {/* Title */}
          <div className="kfpl-nm-form-card">
            <div className="kfpl-nm-form-card-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              <h3>Article Details</h3>
            </div>
            <div className="kfpl-nm-form-card-body">
              <div className="kfpl-input-group">
                <label className="kfpl-input-label">Title <span className="required">*</span></label>
                <input
                  className="kfpl-input"
                  type="text"
                  placeholder="Enter article title..."
                  value={form.title}
                  onChange={e => handleChange('title', e.target.value)}
                />
              </div>
              <div className="kfpl-input-group">
                <label className="kfpl-input-label">Excerpt / Summary</label>
                <textarea
                  className="kfpl-textarea"
                  rows={2}
                  placeholder="Brief summary shown on cards..."
                  value={form.excerpt}
                  onChange={e => handleChange('excerpt', e.target.value)}
                />
              </div>
              <div className="kfpl-input-group">
                <label className="kfpl-input-label">Content <span className="required">*</span></label>
                <div className="kfpl-nm-quill-editor-wrapper">
                  <ReactQuill
                    theme="snow"
                    placeholder="Write the full article content here..."
                    value={form.content}
                    onChange={val => handleChange('content', val)}
                    modules={{
                      toolbar: [
                        [{ 'font': [] }, { 'size': ['small', false, 'large', 'huge'] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'color': [] }, { 'background': [] }],
                        [{ 'header': [1, 2, 3, 4, false] }, 'blockquote', 'code-block'],
                        [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
                        [{ 'align': [] }],
                        ['link', 'image', 'video'],
                        ['clean']
                      ]
                    }}
                  />
                </div>
              </div>
              <div className="kfpl-input-row" style={{ display: 'flex', gap: '16px', marginBottom: '16px', marginTop: '20px' }}>
                <div className="kfpl-input-group" style={{ flex: 2 }}>
                  <label className="kfpl-input-label">Special Highlight Quote</label>
                  <textarea
                    className="kfpl-textarea"
                    rows={2}
                    placeholder="Highlight a key quote statement..."
                    value={form.quote || ''}
                    onChange={e => handleChange('quote', e.target.value)}
                  />
                </div>
                <div className="kfpl-input-group" style={{ flex: 1 }}>
                  <label className="kfpl-input-label">Quote Author/Role</label>
                  <input
                    className="kfpl-input"
                    type="text"
                    placeholder="e.g. Chief Executive Officer"
                    value={form.quoteAuthor || ''}
                    onChange={e => handleChange('quoteAuthor', e.target.value)}
                  />
                </div>
              </div>
              <div className="kfpl-input-group" style={{ marginBottom: '16px' }}>
                <label className="kfpl-input-label">Investor Advisory Notice (Optional)</label>
                <textarea
                  className="kfpl-textarea"
                  rows={2}
                  placeholder="Enter custom advisory text, or leave blank to show the default relations advisory note..."
                  value={form.advisory || ''}
                  onChange={e => handleChange('advisory', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Featured Image */}
          <div className="kfpl-nm-form-card">
            <div className="kfpl-nm-form-card-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              <h3>Featured Image</h3>
            </div>
            <div className="kfpl-nm-form-card-body">
              {imagePreview ? (
                <div className="kfpl-nm-image-preview-wrapper">
                  <img src={imagePreview} alt="Preview" className="kfpl-nm-image-preview" />
                  <div className="kfpl-nm-image-preview-actions">
                    <button type="button" className="kfpl-btn kfpl-btn--ghost" onClick={() => fileInputRef.current?.click()}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      Replace
                    </button>
                    <button type="button" className="kfpl-btn kfpl-btn--danger-ghost" onClick={removeImage}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={`kfpl-nm-dropzone ${isDragging ? 'dragging' : ''}`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="kfpl-nm-dropzone-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                  </div>
                  <p className="kfpl-nm-dropzone-title">Click to upload or drag & drop</p>
                  <p className="kfpl-nm-dropzone-hint">JPG, PNG, GIF, or WebP (max 5MB)</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => handleImageUpload(e.target.files[0])}
              />
            </div>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="kfpl-nm-form-sidebar">
          {/* Publish Settings */}
          <div className="kfpl-nm-form-card">
            <div className="kfpl-nm-form-card-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              <h3>Publish</h3>
            </div>
            <div className="kfpl-nm-form-card-body">
              <div className="kfpl-input-group">
                <label className="kfpl-input-label">Status</label>
                <select className="kfpl-select" value={form.status} onChange={e => handleChange('status', e.target.value)}>
                  <option value="Draft">Draft</option>
                  <option value="Published">Published</option>
                </select>
              </div>
              <div className="kfpl-input-group">
                <label className="kfpl-input-label">Publish Date</label>
                <input className="kfpl-input" type="date" value={form.date} onChange={e => handleChange('date', e.target.value)} />
              </div>
              <div className="kfpl-nm-publish-actions">
                <button type="button" className="kfpl-btn kfpl-btn--ghost" onClick={() => navigate('/news-media')} disabled={submitting}>Cancel</button>
                <button type="submit" className="kfpl-btn kfpl-btn--primary" disabled={!isValid || submitting}>
                  {submitting ? 'Saving...' : (isEditing ? 'Update Article' : 'Publish Article')}
                </button>
              </div>
            </div>
          </div>

          {/* Category & Author */}
          <div className="kfpl-nm-form-card">
            <div className="kfpl-nm-form-card-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
              <h3>Metadata</h3>
            </div>
            <div className="kfpl-nm-form-card-body">
              <div className="kfpl-input-group">
                <label className="kfpl-input-label">Category <span className="required">*</span></label>
                <select
                  className="kfpl-select"
                  value={showNewCategoryInput ? '__NEW__' : form.category}
                  onChange={e => {
                    if (e.target.value === '__NEW__') {
                      setShowNewCategoryInput(true);
                    } else {
                      setShowNewCategoryInput(false);
                      handleChange('category', e.target.value);
                    }
                  }}
                >
                  {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value="__NEW__">+ Add New Category...</option>
                </select>

                {showNewCategoryInput && (
                  <div className="kfpl-new-category-input-wrapper" style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      className="kfpl-input"
                      style={{ flex: 1 }}
                      placeholder="Category name..."
                      value={newCategoryName}
                      onChange={e => setNewCategoryName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddNewCategory();
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="kfpl-btn kfpl-btn--primary"
                      style={{ padding: '0 12px', minWidth: 'auto', fontSize: '0.8125rem' }}
                      onClick={handleAddNewCategory}
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      className="kfpl-btn kfpl-btn--ghost"
                      style={{ padding: '0 12px', minWidth: 'auto', fontSize: '0.8125rem' }}
                      onClick={() => {
                        setShowNewCategoryInput(false);
                        setNewCategoryName('');
                        if (categoriesList.length > 0) {
                          handleChange('category', categoriesList[0]);
                        }
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
              <div className="kfpl-input-group">
                <label className="kfpl-input-label">Author <span className="required">*</span></label>
                <input
                  className="kfpl-input"
                  type="text"
                  placeholder="Author name..."
                  value={form.author}
                  onChange={e => handleChange('author', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

/* ============ END: NewsMediaForm.jsx ============ */
