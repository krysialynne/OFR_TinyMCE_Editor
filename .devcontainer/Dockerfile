FROM mcr.microsoft.com/devcontainers/javascript-node:1-20-bullseye

# Install basic development utilities and .NET prerequisites
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    curl \
    wget \
    apt-transport-https \
    gnupg \
    ca-certificates \
    unzip

# Install .NET SDK (Required by Microsoft Power Platform CLI for solution packaging)
RUN wget https://packages.microsoft.com/config/debian/11/packages-microsoft-prod.deb -O packages-microsoft-prod.deb \
    && dpkg -i packages-microsoft-prod.deb \
    && rm packages-microsoft-prod.deb \
    && apt-get update \
    && apt-get -y install dotnet-sdk-8.0

# Enable Corepack and prepare pnpm as ROOT so it has permissions to /usr/local/bin
RUN corepack enable && corepack prepare pnpm@latest --activate

# Now switch to the non-root 'node' user for user-specific tooling
USER node

# Download and install pac CLI
RUN mkdir -p /home/node/.pac \
    && curl -L -o /home/node/.pac/pac.zip https://aka.ms/powerappscli \
    && unzip /home/node/.pac/pac.zip -d /home/node/.pac/ \
    && rm /home/node/.pac/pac.zip \
    && chmod +x /home/node/.pac/tools/pac

# Add PAC CLI to the PATH
ENV PATH="${PATH}:/home/node/.pac/tools"
