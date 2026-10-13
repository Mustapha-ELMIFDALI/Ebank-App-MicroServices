package elmifdali.ebankservice.controllers;

import jakarta.validation.ConstraintViolationException;
import org.springframework.http.*;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.stream.Collectors;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(ResponseStatusException.class)
    ResponseEntity<ProblemDetail> status(ResponseStatusException e) {
        return ResponseEntity.status(e.getStatusCode())
                .body(ProblemDetail.forStatusAndDetail(e.getStatusCode(), e.getReason() == null ? "" : e.getReason()));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    ProblemDetail invalid(ConstraintViolationException e) {
        String detail = e.getConstraintViolations().stream()
                .map(v -> v.getPropertyPath().toString().replaceAll("^.*\\.", "") + " " + v.getMessage())
                .sorted().collect(Collectors.joining(", "));
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, detail);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ProblemDetail unreadable() {
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "The request body is not valid");
    }
}
