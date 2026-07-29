FROM php:8.2-apache

# Install SQLite development libraries and PHP SQLite extensions
RUN apt-get update \
    && apt-get install -y --no-install-recommends libsqlite3-dev \
    && docker-php-ext-install pdo_sqlite \
    && rm -rf /var/lib/apt/lists/*

# Enable Apache rewrite
RUN a2enmod rewrite

# Copy server application
COPY . /var/www/html/

EXPOSE 80