package com.example.hotelres;

import java.util.Map;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(DataIntegrityViolationException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public Map<String,String> handleDuplicate(DataIntegrityViolationException e) {
        String msg = e.getMostSpecificCause().getMessage();
        if (msg.contains("uk_users_login")) return Map.of("error", "이미 사용 중인 아이디입니다.");
        if (msg.contains("uk_users_email")) return Map.of("error", "이미 등록된 이메일입니다.");
        return Map.of("error", "중복 데이터 오류");
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String,String> handleIllegal(IllegalArgumentException e) {
        return Map.of("error", e.getMessage());
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public Map<String,String> handleGeneric(Exception e) {
        e.printStackTrace();
        return Map.of("error", "서버 오류: " + e.getClass().getSimpleName());
    }
}
