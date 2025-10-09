from pathlib import Path
import os
from dotenv import load_dotenv

# 🔹 Učitaj .env varijable ako postoje
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

# -----------------------------------------------------
# ✅ SECURITY & DEBUG
# -----------------------------------------------------
SECRET_KEY = os.environ.get(
    'SECRET_KEY',
    'django-insecure-95(^@reckt+)sr0y=9e$tge!r7!kk@-g9u=b^a#_$v-mh#w$pp'
)
DEBUG = os.environ.get('DEBUG', 'True') == 'True'

ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    'ecommerce-dashboard-px5q.onrender.com',  # Render backend
    'airdimitrije.github.io',                 # GitHub Pages frontend
]

# -----------------------------------------------------
# ✅ INSTALLED APPS
# -----------------------------------------------------
INSTALLED_APPS = [
    # Admin panel
    'jazzmin',

    # Django core apps
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Aplikacije projekta
    'shop',
    'core',
    'store',
    'dashboard',

    # REST API i filteri
    'rest_framework',
    'django_filters',

    # CORS podrška
    'corsheaders',
]

AUTH_USER_MODEL = 'core.User'

# -----------------------------------------------------
# ✅ MIDDLEWARE
# -----------------------------------------------------
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",  # mora biti visoko
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",  # za statičke fajlove
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

# -----------------------------------------------------
# ✅ URLS / TEMPLATES / WSGI
# -----------------------------------------------------
ROOT_URLCONF = 'ecommerce.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'ecommerce.wsgi.application'

# -----------------------------------------------------
# ✅ DATABASE CONFIG
# -----------------------------------------------------
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': os.environ.get('DB_NAME', 'ecommerce'),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'USER': os.environ.get('DB_USER', 'root'),
        'PASSWORD': os.environ.get('DB_PASSWORD', '123Qwertz123?'),
        'PORT': os.environ.get('DB_PORT', '3306'),
    }
}

# -----------------------------------------------------
# ✅ PASSWORD VALIDATORS
# -----------------------------------------------------
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# -----------------------------------------------------
# ✅ LOCALIZATION
# -----------------------------------------------------
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# -----------------------------------------------------
# ✅ STATIC FILES
# -----------------------------------------------------
STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# -----------------------------------------------------
# ✅ CORS & CSRF CONFIGURATION
# -----------------------------------------------------
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",                     # lokalni razvoj
    "https://airdimitrije.github.io",            # GitHub Pages frontend
]

CSRF_TRUSTED_ORIGINS = [
    "https://airdimitrije.github.io",
    "https://ecommerce-dashboard-px5q.onrender.com",  # Render backend
]

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = ["*"]
CORS_ALLOW_METHODS = ["*"]

# (Opcionalno, samo za testiranje — ne koristiti stalno!)
# CORS_ALLOW_ALL_ORIGINS = True

# -----------------------------------------------------
# ✅ REST FRAMEWORK CONFIG
# -----------------------------------------------------
# -----------------------------------------------------
# ✅ REST FRAMEWORK CONFIG
# -----------------------------------------------------
# -----------------------------------------------------
# ✅ REST FRAMEWORK CONFIG
# -----------------------------------------------------
REST_FRAMEWORK = {
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PAGINATION_CLASS': 'shop.pagination.StandardPagination',  # ✅ sada koristi novi fajl
    'PAGE_SIZE': 8,
}



# -----------------------------------------------------
# ✅ DEFAULTS
# -----------------------------------------------------
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
