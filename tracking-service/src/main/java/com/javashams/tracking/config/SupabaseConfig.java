package com.javashams.tracking.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import org.springframework.context.annotation.Bean;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
@ConfigurationProperties(prefix = "supabase")
public class SupabaseConfig {

    private String url;
    private String anonKey;
    private String serviceRoleKey;

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getAnonKey() {
        return anonKey;
    }

    public void setAnonKey(String anonKey) {
        this.anonKey = anonKey;
    }

    public String getServiceRoleKey() {
        return serviceRoleKey;
    }

    public void setServiceRoleKey(String serviceRoleKey) {
        this.serviceRoleKey = serviceRoleKey;
    }

    /**
     * Provides a pre-configured WebClient.Builder for Supabase REST API access.
     */
    @Bean
    public WebClient.Builder supabaseWebClientBuilder() {
        return WebClient.builder()
                .baseUrl(this.url)
                .defaultHeader("apikey", this.anonKey)
                .defaultHeader("Authorization", "Bearer " + this.serviceRoleKey);
    }
}
