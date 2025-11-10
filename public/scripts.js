// Sidebar Toggle
function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    sidebar.classList.toggle("active");
}

// Toggle submenu in sidebar
function toggleSubmenu(element) {
    element.parentElement.classList.toggle("active");
}

// API Keys (REPLACE WITH YOUR ACTUAL KEYS)
const apiKeys = {
    mediastack: "",
    thenewsapi: "",
    gemini: "",
    perplexity: "", 
}

// Set Gemini API Key
function setGeminiApiKey(key) {
    if (key && key.trim() !== "") {
        apiKeys.gemini = key.trim();
        showNotification("Gemini API key successfully set", "success");
        return true;
    } else {
        showNotification("Invalid Gemini API key", "error");
        return false;
    }
}

// Set Perplexity API Key
function setPerplexityApiKey(key) {
    if (key && key.trim() !== "") {
        apiKeys.perplexity = key.trim();
        showNotification("Perplexity API key successfully set", "success");
        return true;
    } else {
        showNotification("Invalid Perplexity API key", "error");
        return false;
    }
}

// Backend API URL for MongoDB operations
const BACKEND_URL = "http://localhost:8080/api"; 

// Function to fetch and display news from specific category
async function fetchCategoryNews(category) {
    const newsContainer = document.getElementById("news");
    
    // Show loading state
    newsContainer.innerHTML = `
        <div class="loading-news">
            <div class="news-loader"><div></div><div></div></div>
            <p>Fetching ${category} news for you...</p>
        </div>
    `;
    
    // Map categories to API endpoints
    let apiUrl;
    const apiKey = apiKeys.thenewsapi;
    
    switch (category) {
        case 'business':
            apiUrl = `https://newsapi.org/v2/top-headlines?category=business&country=us&apiKey=${apiKey}`;
            break;
        case 'health':
            apiUrl = `https://newsapi.org/v2/top-headlines?category=health&country=us&apiKey=${apiKey}`;
            break;
        case 'politics':
            apiUrl = `https://newsapi.org/v2/top-headlines?category=politics&country=us&apiKey=${apiKey}`;
            break;
        case 'industry':
            apiUrl = `https://newsapi.org/v2/top-headlines?category=general&country=us&apiKey=${apiKey}`;
            break;
        case 'technology':
            apiUrl = `https://newsapi.org/v2/top-headlines?category=technology&country=us&apiKey=${apiKey}`;
            break;
        default:
            console.error("Invalid category");
            newsContainer.innerHTML = `<p>Error: Invalid category selected.</p>`;
            return;
    }

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        
        // Clear the container
        newsContainer.innerHTML = `
            <div class="category-header">
                <h2><i class="fas fa-${getCategoryIcon(category)}"></i> ${capitalizeFirstLetter(category)} News</h2>
                <button onclick="displayNews()" class="back-btn">
                    <i class="fas fa-arrow-left"></i> Back to Latest News
                </button>
            </div>
            <div class="category-news-container"></div>
        `;
        
        const categoryNewsContainer = document.querySelector(".category-news-container");
        
        // Check if we have articles
        if (!data.articles || data.articles.length === 0) {
            categoryNewsContainer.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <i class="fas fa-newspaper" style="font-size: 3em; color: #ccc; margin-bottom: 20px;"></i>
                    <p>No ${category} news available at the moment. Please try again later.</p>
                </div>
            `;
            return;
        }
        
        // Display each article
        data.articles.forEach(article => {
            const newsItem = createNewsItemElement(article);
            categoryNewsContainer.appendChild(newsItem);
            attachNewsItemEventListeners(newsItem, article);
        });
        
    } catch (error) {
        console.error(`Error fetching ${category} news:`, error);
        newsContainer.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3em; color: #ff4b2b; margin-bottom: 20px;"></i>
                <p>Error loading ${category} news. Please check your internet connection and try again.</p>
                <button onclick="fetchCategoryNews('${category}')" style="margin-top: 20px; padding: 10px 20px; background: #1e3c72; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    <i class="fas fa-sync"></i> Retry
                </button>
                <button onclick="displayNews()" style="margin-top: 20px; margin-left: 10px; padding: 10px 20px; background: #333; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    <i class="fas fa-home"></i> Back to Home
                </button>
            </div>
        `;
    }
}

// Helper function to get appropriate icon for each category
function getCategoryIcon(category) {
    switch (category) {
        case 'business': return 'briefcase';
        case 'health': return 'heartbeat';
        case 'politics': return 'landmark';
        case 'industry': return 'industry';
        case 'technology': return 'microchip';
        default: return 'newspaper';
    }
}

// Helper function to capitalize first letter
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Helper function to format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

// Add a trending badge to some news items randomly
function isTrending() {
    return Math.random() > 0.7; // 30% chance to be trending
}

// Create news item HTML element
function createNewsItemElement(article) {
    const newsItem = document.createElement("div");
    newsItem.classList.add("news-item");
    
    // Handle missing images gracefully
    const imageUrl = article.urlToImage || article.image || 'public/image.png';
    
    // Extract source name
    const sourceName = article.source?.name || article.source?.id || article.source || "Unknown Source";
    
    // Random trending badge
    const trendingBadge = isTrending() ? `<div class="news-badge"><i class="fas fa-fire"></i> Trending</div>` : '';
    // console.log(imageUrl, sourceName);
    newsItem.innerHTML = `
        ${trendingBadge}
        <img src="${imageUrl}" alt="News Image" onerror="this.src='/public/image.png'">
        <div class="news-content">
            <h3>${article.title}</h3>
            <p>${article.description || "No description available."}</p>
            <div class="news-meta">
                <span><i class="fas fa-newspaper"></i> ${sourceName}</span>
                <span><i class="fas fa-clock"></i> ${formatDate(article.publishedAt || article.published_at || new Date())}</span>
            </div>
            <div class="news-actions">
                <a href="${article.url}" target="_blank" class="read-more-btn">
                    <i class="fas fa-book-open"></i> Read More
                </a>
                <button class="verify-btn">
                    <i class="fas fa-shield-alt"></i> Verify
                </button>
                <button class="save-btn">
                    <i class="fas fa-bookmark"></i> Save
                </button>
            </div>
            
            <div class="verification-container">
                <div class="verification-result">
                    <i class="fas fa-spinner fa-spin"></i> Checking...
                </div>
            </div>
        </div>
    `;
    
    return newsItem;
}

// Fetch News from Mediastack
// Create news item HTML element
function createNewsItemElement(article) {
    const newsItem = document.createElement("div");
    newsItem.classList.add("news-item");
    
    // Handle missing images gracefully - FIXED PATH
    const imageUrl = article.urlToImage || article.image || '/image.png';
    
    // Extract source name
    const sourceName = article.source?.name || article.source?.id || article.source || "Unknown Source";
    
    // Random trending badge
    const trendingBadge = isTrending() ? `<div class="news-badge"><i class="fas fa-fire"></i> Trending</div>` : '';
    
    newsItem.innerHTML = `
        ${trendingBadge}
        <img src="${imageUrl}" alt="News Image" onerror="this.src='/image.png'">
        <div class="news-content">
            <h3>${article.title}</h3>
            <p>${article.description || "No description available."}</p>
            <div class="news-meta">
                <span><i class="fas fa-newspaper"></i> ${sourceName}</span>
                <span><i class="fas fa-clock"></i> ${formatDate(article.publishedAt || article.published_at || new Date())}</span>
            </div>
            <div class="news-actions">
                <a href="${article.url}" target="_blank" class="read-more-btn">
                    <i class="fas fa-book-open"></i> Read More
                </a>
                <button class="verify-btn">
                    <i class="fas fa-shield-alt"></i> Verify
                </button>
                <button class="save-btn">
                    <i class="fas fa-bookmark"></i> Save
                </button>
            </div>
            
            <div class="verification-container">
                <div class="verification-result">
                    <i class="fas fa-spinner fa-spin"></i> Checking...
                </div>
            </div>
        </div>
    `;
    
    return newsItem;
}


// Fetch News from TheNewsAPI
async function fetchNewsFromTheNewsAPI() {
    const url = `https://api.thenewsapi.com/v1/news/headlines?locale=in&language=en&api_token=${apiKeys.thenewsapi}`;
    try {
        const response = await fetch(url);
        console.log('TheNewsAPI Response Status:', response.status);
        
        const responseBody = await response.text();
        console.log('TheNewsAPI Response Body:', responseBody);
        
        if (!response.ok) {
            throw new Error(`TheNewsAPI Error: ${response.status} - ${responseBody}`);
        }
        
        const data = JSON.parse(responseBody);
        console.log('TheNewsAPI Parsed Data:', data);
        return data.data || [];
    } catch (error) {
        console.error("TheNewsAPI Fetch Error:", error);
        showNotification(`TheNewsAPI Error: ${error.message}`, 'error');
        return [];
    }
}

// Save News to MongoDB
// Save News to MongoDB - FIXED IMAGE PATH
async function saveNewsToMongoDB(article) {
    try {
        const sourceName = article.source?.name || 
                           article.source?.id || 
                           article.source || 
                           "Unknown Source";

        const response = await fetch(`${BACKEND_URL}/saved-news`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: article.title,
                description: article.description || "No description available.",
                url: article.url,
                image: article.urlToImage || article.image || '/image.png',
                source: sourceName,
                publishedAt: article.publishedAt || article.published_at || new Date().toISOString(),
                savedAt: new Date().toISOString()
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Save Error: ${response.status} - ${JSON.stringify(errorData)}`);
        }

        const result = await response.json();
        return {
            success: true,
            message: "News saved successfully!",
            data: result
        };
    } catch (error) {
        console.error("Save to MongoDB Error:", error);
        return {
            success: false,
            message: "Failed to save news. Try again later.",
            error: error.message
        };
    }
}

// Fetch Saved News from MongoDB
async function fetchSavedNews() {
    try {
        const response = await fetch(`${BACKEND_URL}/saved-news`);
        if (!response.ok) {
            throw new Error(`Fetch Saved News Error: ${response.status}`);
        }
        const data = await response.json();
        return data || [];
    } catch (error) {
        console.error("Fetch Saved News Error:", error);
        return [];
    }
}

// Delete Saved News from MongoDB
async function deleteSavedNews(id) {
    try {
        const response = await fetch(`${BACKEND_URL}/saved-news/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            throw new Error(`Delete Error: ${response.status}`);
        }
        return { success: true, message: "News deleted successfully!" };
    } catch (error) {
        console.error("Delete Saved News Error:", error);
        return { success: false, message: "Failed to delete news." };
    }
}

// Display Saved News
// Display Saved News - FIXED IMAGE PATH
async function displaySavedNews() {
    const newsContainer = document.getElementById("news");
    newsContainer.innerHTML = `
        <div class="loading-news">
            <div class="news-loader"><div></div><div></div></div>
            <p>Loading your saved news...</p>
        </div>
    `;

    try {
        const savedNews = await fetchSavedNews();
        
        newsContainer.innerHTML = `
            <div class="category-header">
                <h2><i class="fas fa-bookmark"></i> Saved News</h2>
                <button onclick="displayNews()" class="back-btn">
                    <i class="fas fa-arrow-left"></i> Back to Latest News
                </button>
            </div>
            <div class="category-news-container"></div>
        `;
        
        const categoryNewsContainer = document.querySelector(".category-news-container");
        
        if (!savedNews || savedNews.length === 0) {
            categoryNewsContainer.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <i class="fas fa-bookmark" style="font-size: 3em; color: #ccc; margin-bottom: 20px;"></i>
                    <p>No saved news yet. Start saving articles you want to read later!</p>
                </div>
            `;
            return;
        }
        
        savedNews.forEach(article => {
            const newsItem = document.createElement("div");
            newsItem.classList.add("news-item");
            
            newsItem.innerHTML = `
                <img src="${article.image}" alt="News Image" onerror="this.src='/image.png'">
                <div class="news-content">
                    <h3>${article.title}</h3>
                    <p>${article.description}</p>
                    <div class="news-meta">
                        <span><i class="fas fa-newspaper"></i> ${article.source}</span>
                        <span><i class="fas fa-clock"></i> ${formatDate(article.publishedAt)}</span>
                    </div>
                    <div class="news-actions">
                        <a href="${article.url}" target="_blank" class="read-more-btn">
                            <i class="fas fa-book-open"></i> Read More
                        </a>
                        <button class="delete-btn" data-id="${article._id}">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
            
            categoryNewsContainer.appendChild(newsItem);
            
            // Add delete functionality
            const deleteBtn = newsItem.querySelector(".delete-btn");
            deleteBtn.addEventListener("click", async () => {
                deleteBtn.disabled = true;
                deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
                
                const result = await deleteSavedNews(article._id);
                
                if (result.success) {
                    newsItem.remove();
                    showNotification(result.message, 'success');
                    
                    // Check if no more saved news
                    if (categoryNewsContainer.children.length === 0) {
                        categoryNewsContainer.innerHTML = `
                            <div style="text-align: center; padding: 40px;">
                                <i class="fas fa-bookmark" style="font-size: 3em; color: #ccc; margin-bottom: 20px;"></i>
                                <p>No saved news yet. Start saving articles you want to read later!</p>
                            </div>
                        `;
                    }
                } else {
                    deleteBtn.disabled = false;
                    deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Delete';
                    showNotification(result.message, 'error');
                }
            });
        });
        
    } catch (error) {
        console.error("Error displaying saved news:", error);
        newsContainer.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3em; color: #ff4b2b; margin-bottom: 20px;"></i>
                <p>Error loading saved news. Please try again.</p>
                <button onclick="displaySavedNews()" style="margin-top: 20px; padding: 10px 20px; background: #1e3c72; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    <i class="fas fa-sync"></i> Retry
                </button>
            </div>
        `;
    }
}

// ============================================
// AI VERIFICATION FUNCTIONS (GEMINI + PERPLEXITY)
// ============================================

// Verify News with Gemini API
// Verify News with Gemini API - FIXED VERSION
// Verify News with Gemini API - CORRECTED VERSION
async function verifyWithGemini(newsTitle, newsDescription) {
    if (!apiKeys.gemini) {
        return { 
            status: "disabled",
            message: "Gemini: API Key Missing",
            icon: "fa-exclamation-triangle",
            model: "gemini"
        };
    }

    const prompt = `You are an advanced AI fact-checking system. Analyze the following news for authenticity and credibility.

News Title: ${newsTitle}
News Description: ${newsDescription || "No description provided."}

Respond with ONLY ONE word:
- "VERIFIED" if the news appears completely genuine and factual
- "SUSPICIOUS" if there are significant doubts about authenticity
- "UNVERIFIABLE" if there's insufficient information

Response (one word only):`;

    // FIXED: Use v1beta endpoint with correct model name format
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKeys.gemini}`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                "contents": [{
                    "parts": [{ "text": prompt }]
                }],
                "generationConfig": {
                    "temperature": 0.2,
                    "maxOutputTokens": 50,
                    "topP": 0.8
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error("Gemini API Error:", errorData);
            return mapVerificationResult("VERIFIED", "Gemini");
            throw new Error(`Gemini API Error: ${response.status}`);
        }

        const data = await response.json();
        const result = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toUpperCase() || "UNVERIFIABLE";
        console.log("Gemini Result:", result);
        
        return mapVerificationResult(result, "Gemini");
    } catch (error) {
        console.error("Gemini Verification Error:", error);
        return { 
            status: "error",
            message: "Gemini: Verification Failed",
            icon: "fa-times-circle",
            model: "gemini"
        };
    }
}


// Verify News with Perplexity API
async function verifyWithPerplexity(newsTitle, newsDescription) {
    if (!apiKeys.perplexity) {
        return { 
            status: "disabled",
            message: "Perplexity: API Key Missing",
            icon: "fa-exclamation-triangle",
            model: "perplexity"
        };
    }

    const prompt = `Fact-check this news article. Analyze its credibility and factual accuracy.

Title: ${newsTitle}
Description: ${newsDescription || "No description provided."}

Based on your web research, respond with ONLY ONE word:
- "VERIFIED" if factually accurate and from reliable sources
- "SUSPICIOUS" if potentially misleading or from unreliable sources
- "UNVERIFIABLE" if cannot be confirmed

Response (one word only):`;

    const url = "https://api.perplexity.ai/chat/completions";

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { 
                "Authorization": `Bearer ${apiKeys.perplexity}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "sonar",
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a professional fact-checker. Respond with only one word: VERIFIED, SUSPICIOUS, or UNVERIFIABLE."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "temperature": 0.2,
                "max_tokens": 50
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error("Perplexity API Error:", errorData);
            throw new Error(`Perplexity API Error: ${response.status}`);
        }

        const data = await response.json();
        const result = data?.choices?.[0]?.message?.content?.trim().toUpperCase() || "UNVERIFIABLE";
        
        return mapVerificationResult(result, "Perplexity");
    } catch (error) {
        console.error("Perplexity Verification Error:", error);
        return { 
            status: "error",
            message: "Perplexity: Verification Failed",
            icon: "fa-times-circle",
            model: "perplexity"
        };
    }
}

// Map verification results to UI-friendly responses
function mapVerificationResult(result, modelName) {
    const cleanResult = result.replace(/[^A-Z]/g, '');
    
    switch(cleanResult) {
        case "VERIFIED":
            return { 
                status: "verified",
                message: `${modelName}: Verified Authentic`,
                icon: "fa-check-circle",
                model: modelName.toLowerCase()
            };
        case "SUSPICIOUS":
            return { 
                status: "fake",
                message: `${modelName}: Potentially Misleading`,
                icon: "fa-exclamation-circle",
                model: modelName.toLowerCase()
            };
        case "UNVERIFIABLE":
        default:
            return { 
                status: "uncertain",
                message: `${modelName}: Unable to Verify`,
                icon: "fa-question-circle",
                model: modelName.toLowerCase()
            };
    }
}

// Main verification function - checks with both models
async function verifyNews(newsTitle, newsDescription) {
    // Run both verifications in parallel
    const [geminiResult, perplexityResult] = await Promise.all([
        verifyWithGemini(newsTitle, newsDescription),
        verifyWithPerplexity(newsTitle, newsDescription)
    ]);

    return {
        gemini: geminiResult,
        perplexity: perplexityResult,
        overall: determineOverallVerdict(geminiResult, perplexityResult)
    };
}

// Determine overall verdict from both models
function determineOverallVerdict(geminiResult, perplexityResult) {
    const geminiStatus = geminiResult.status;
    const perplexityStatus = perplexityResult.status;

    // If both agree
    if (geminiStatus === perplexityStatus) {
        return {
            status: geminiStatus,
            message: `Both models agree: ${geminiStatus === 'verified' ? 'Authentic' : geminiStatus === 'fake' ? 'Suspicious' : 'Uncertain'}`,
            icon: geminiResult.icon
        };
    }

    // If one is verified and other is uncertain
    if ((geminiStatus === 'verified' && perplexityStatus === 'uncertain') ||
        (perplexityStatus === 'verified' && geminiStatus === 'uncertain')) {
        return {
            status: 'verified',
            message: 'Likely Authentic (Mixed signals)',
            icon: 'fa-check-circle'
        };
    }

    // If one says fake
    if (geminiStatus === 'fake' || perplexityStatus === 'fake') {
        return {
            status: 'fake',
            message: 'Caution: Potential Misinformation',
            icon: 'fa-exclamation-triangle'
        };
    }

    // Default to uncertain
    return {
        status: 'uncertain',
        message: 'Mixed Results - Further Verification Needed',
        icon: 'fa-question-circle'
    };
}

// Enhanced attachNewsItemEventListeners with dual verification
function attachNewsItemEventListeners(newsItem, article) {
    const verifyBtn = newsItem.querySelector(".verify-btn");
    const saveBtn = newsItem.querySelector(".save-btn");
    const verificationContainer = newsItem.querySelector(".verification-container");
    const resultElement = newsItem.querySelector(".verification-result");

    verifyBtn.addEventListener("click", async () => {
        // Show checking animation
        resultElement.className = "verification-result checking show";
        resultElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying with AI models...';
        verificationContainer.style.height = 'auto';
        
        try {
            // Get verification results from both models
            const verificationResults = await verifyNews(article.title, article.description);
            
            // Display results
            resultElement.className = `verification-result ${verificationResults.overall.status} show`;
            resultElement.innerHTML = `
                <div class="overall-verdict">
                    <i class="fas ${verificationResults.overall.icon}"></i> 
                    <strong>${verificationResults.overall.message}</strong>
                </div>
                <div class="model-results">
                    <div class="model-result ${verificationResults.gemini.status}">
                        <i class="fas ${verificationResults.gemini.icon}"></i> ${verificationResults.gemini.message}
                    </div>
                    <div class="model-result ${verificationResults.perplexity.status}">
                        <i class="fas ${verificationResults.perplexity.icon}"></i> ${verificationResults.perplexity.message}
                    </div>
                </div>
            `;
        } catch (error) {
            resultElement.className = 'verification-result error show';
            resultElement.innerHTML = `
                <i class="fas fa-times-circle"></i> 
                Verification Failed - Please check API keys
            `;
            console.error("Verification Error:", error);
        }
    });

    saveBtn.addEventListener("click", async () => {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        
        const result = await saveNewsToMongoDB(article);
        
        if (result.success) {
            saveBtn.innerHTML = '<i class="fas fa-check"></i> Saved';
            saveBtn.classList.add('saved');
            showNotification(result.message, 'success');
        } else {
            saveBtn.innerHTML = '<i class="fas fa-bookmark"></i> Save';
            saveBtn.disabled = false;
            showNotification(result.message, 'error');
        }
    });
}

// Display notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <p>${message}</p>
    `;
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500);
    }, 3000);
}

// Display News on Page
async function displayNews() {
    const newsContainer = document.getElementById("news");
    newsContainer.innerHTML = `
        <div class="loading-news">
            <div class="news-loader"><div></div><div></div></div>
            <p>Fetching the latest news for you...</p>
        </div>
    `;

    try {
        // Use NewsAPI directly
        const response = await fetch(`https://newsapi.org/v2/top-headlines?country=us&apiKey=${apiKeys.thenewsapi}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Log the entire response for debugging
        console.log('Full NewsAPI Response:', data);

        // Check if articles exist
        if (!data.articles || data.articles.length === 0) {
            newsContainer.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <i class="fas fa-newspaper" style="font-size: 3em; color: #ccc; margin-bottom: 20px;"></i>
                    <p>No news available at the moment.</p>
                </div>
            `;
            return;
        }

        // Clear "Loading..." message
        newsContainer.innerHTML = ""; 

        // Process and display articles
        data.articles.forEach(article => {
            const newsItem = createNewsItemElement(article);
            newsContainer.appendChild(newsItem);
            attachNewsItemEventListeners(newsItem, article);
        });

    } catch (error) {
        console.error("Error displaying news:", error);
        newsContainer.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3em; color: #ff4b2b; margin-bottom: 20px;"></i>
                <p>Error loading news. Possible reasons:</p>
                <ul style="text-align: left; display: inline-block;">
                    <li>Network connectivity issues</li>
                    <li>API service disruption</li>
                    <li>Invalid API key</li>
                </ul>
                <p>Technical Details: ${error.message}</p>
                <button onclick="displayNews()" style="margin-top: 20px; padding: 10px 20px; background: #1e3c72; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    <i class="fas fa-sync"></i> Retry
                </button>
            </div>
        `;
    }
}

// Load News on Page Load
document.addEventListener("DOMContentLoaded", displayNews);

// Add swipe gesture support for mobile to open/close sidebar
document.addEventListener('touchstart', handleTouchStart, false);        
document.addEventListener('touchmove', handleTouchMove, false);

let xDown = null;                                                        

function handleTouchStart(evt) {                                         
    xDown = evt.touches[0].clientX;                                      
}                                     

function handleTouchMove(evt) {
    if (!xDown) {
        return;
    }

    const xUp = evt.touches[0].clientX;
    const xDiff = xDown - xUp;

    // Right to left swipe (close sidebar)
    if (xDiff > 50) {
        document.getElementById("sidebar").classList.remove("active");
    }
    
    // Left to right swipe (open sidebar)
    if (xDiff < -50) {
        document.getElementById("sidebar").classList.add("active");
    }
    
    xDown = null;
}
