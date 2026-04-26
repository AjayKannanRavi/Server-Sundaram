package com.serversundaram.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.serversundaram.entity.Staff;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class LoginResponse {
    private String token;
    private Long userId;
    private String username;
    private Long tenantId;
    private String name;
    private String role;
    private String message;

    public static LoginResponse fromStaff(Staff staff, String token, Long tenantId) {
        return LoginResponse.builder()
            .token(token)
            .userId(staff.getId())
            .username(staff.getUsername())
            .tenantId(tenantId)
            .name(staff.getName())
            .role(staff.getRole().toString())
            .build();
    }
}
