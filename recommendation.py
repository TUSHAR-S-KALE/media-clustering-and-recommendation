import pandas as pd
import numpy as np
import pickle

#Loading dataset
df = pd.read_csv('Data/data.csv')

#Filling missing values
df.fillna('NA', inplace=True)

#Loading cosine similarity matrix
cosine_sim = np.load('Model/cosine_sim.npy')

#Loading TF-IDF vectorizer (can use this if you want to search/get recommendation based on movie description)
#with open('Model/tfidf_vectorizer.pkl', 'rb') as f:
#  tfidf_vectorizer = pickle.load(f)

#tfidf_matrix = np.load('Model/tfidf_matrix.npy')

#Creating reverse mapping from title to index
indices = pd.Series(df.index, index=df['title']).drop_duplicates()

def get_recommendations(title, cosine_sim=cosine_sim, genre=None, release_year=None, content_type=None, age_group=None):
  if title not in indices:
    return "No such Movie/TV Show found"

  idx = indices[title]
  sim_scores = list(enumerate(cosine_sim[idx]))
  sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)[1:]

  movie_indices = [i[0] for i in sim_scores]
  recommendations = df.iloc[movie_indices]

  #Filters
  if genre:
    recommendations = recommendations[recommendations['listed_in'].str.contains(genre, case=False, na=False)]
  if release_year:
    recommendations = recommendations[recommendations['release_year'] == release_year]
  if content_type:
    recommendations = recommendations[recommendations['type'].str.lower() == content_type.lower()]
  if age_group:
    recommendations = recommendations[recommendations['age_group'].str.lower() == age_group.lower()]

  return recommendations[['title', 'listed_in', 'release_year', 'type', 'age_group', 'director', 'cast', 'rating', 'duration']].head(10)
