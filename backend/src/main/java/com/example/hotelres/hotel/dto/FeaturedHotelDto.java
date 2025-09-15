// src/main/java/com/example/hotelres/hotel/dto/FeaturedHotelDto.java
package com.example.hotelres.hotel.dto;

import java.util.List;

public record FeaturedHotelDto(
        Long hotelId,
        String hotelName,
        String region,
        List<RoomTypeDto> roomTypes
) {
    public record RoomTypeDto(
            Long id,
            String name,
            Integer price,
            Integer todayRemaining
    ) {}
}
