FROM node:20-alpine AS frontend
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS backend
WORKDIR /src
COPY WorkDex.Api/WorkDex.Api.csproj ./
RUN dotnet restore
COPY WorkDex.Api/ ./
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=backend /app/publish ./
COPY --from=frontend /frontend/dist ./wwwroot
ENV ASPNETCORE_ENVIRONMENT=Production
ENTRYPOINT ["dotnet", "WorkDex.Api.dll"]
