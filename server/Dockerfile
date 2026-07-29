FROM php:8.2-apache

# SQLite support
RUN apt-get update \
    && apt-get install -y --no-install-recommends libsqlite3-dev \
    && docker-php-ext-install pdo_sqlite \
    && rm -rf /var/lib/apt/lists/*

# Apache modules
RUN a2enmod rewrite headers

# Explicitly allow access to the web root
RUN printf '%s\n' \
    '<Directory /var/www/html/>' \
    '    Options FollowSymLinks' \
    '    AllowOverride All' \
    '    Require all granted' \
    '</Directory>' \
    > /etc/apache2/conf-available/flowbypak.conf \
    && a2enconf flowbypak

# Copy application
COPY . /var/www/html/

# Correct Apache-readable permissions
RUN find /var/www/html -type d -exec chmod 755 {} \; \
    && find /var/www/html -type f -exec chmod 644 {} \;

EXPOSE 80