// src/main/java/com/example/hotelres/hotel/HotelService.java
package com.example.hotelres.hotel;

import com.example.hotelres.hotel.dto.FeaturedHotelDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class HotelService {
    private final HotelRepository hotelRepository;
    private final RoomTypeRepository roomTypeRepository;

    @Transactional(readOnly = true)
    public FeaturedHotelDto getHotelWithRoomTypes(Long hotelId) {
        Hotel h = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new IllegalArgumentException("호텔 없음: " + hotelId));

        var roomTypes = roomTypeRepository.findRoomTypesTodayByHotelId(hotelId)
                .stream()
                .map(p -> new FeaturedHotelDto.RoomTypeDto(
                        p.getId(), p.getName(), p.getPrice(), p.getTodayRemaining()
                ))
                .toList();

        return new FeaturedHotelDto(h.getId(), h.getName(), h.getRegion(), roomTypes);
    }
}
