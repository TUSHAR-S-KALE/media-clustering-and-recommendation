from flask import Flask, request, render_template, jsonify
from flask_cors import CORS
from recommendation import get_recommendations, df
import os
from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__, template_folder='UI')
CORS(app)

@app.route('/')
def home():
  genres = sorted(set(g.strip() for sublist in df['listed_in'].dropna().str.split(',') for g in sublist))
  years = sorted(df['release_year'].dropna().unique(), reverse=True)
  types = sorted(df['type'].dropna().unique())
  age_groups = sorted(df['age_group'].dropna().unique()) if 'age_group' in df.columns else []
  return render_template('index.html',
    genres=genres,
    years=years,
    types=types,
    age_groups=age_groups,
    TMDB_API_KEY=os.getenv("TMDB_API_KEY"),
    TMDB_BASE_URL=os.getenv("TMDB_BASE_URL"),
    TMDB_IMG_BASE=os.getenv("TMDB_IMG_BASE")
    )

@app.route('/recommend', methods=['POST'])
def recommend():
  data = request.json
  title = data.get('title')

  genre = data.get('filters', {}).get('genre')
  release_year = data.get('filters', {}).get('year')
  content_type = data.get('filters', {}).get('type')
  age_group = data.get('filters', {}).get('age_group')

  try:
    release_year = int(release_year) if release_year else None
  except:
    release_year = None

  recommendations = get_recommendations(
    title=title,
    genre=genre,
    release_year=release_year,
    content_type=content_type,
    age_group=age_group
  )

  if isinstance(recommendations, str):
    return jsonify({'error': recommendations})

  return jsonify(recommendations.to_dict(orient='records'))

@app.route('/suggest', methods=['GET'])
def suggest():
  query = request.args.get('q', '').lower()
  if not query:
    return jsonify([])

  suggestions = df[df['title'].str.lower().str.contains(query, na=False)]
  suggestions = suggestions['title'].drop_duplicates().head(5).tolist()

  return jsonify(suggestions)


if __name__ == '__main__':
  app.run(debug=True)
